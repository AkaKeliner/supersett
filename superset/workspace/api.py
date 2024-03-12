import functools
import json
import logging
from datetime import datetime
from io import BytesIO
from typing import Any, Callable, cast, Optional
from zipfile import is_zipfile, ZipFile

from flask import redirect, request, Response, send_file, url_for
from flask_appbuilder import permission_name
from flask_appbuilder.api import expose, protect, rison, safe
from flask_appbuilder.hooks import before_request
from flask_appbuilder.models.sqla.interface import SQLAInterface
from flask_babel import gettext, ngettext
from marshmallow import ValidationError
from werkzeug.wrappers import Response as WerkzeugResponse
from werkzeug.wsgi import FileWrapper
from superset.datasets.schemas import DatasetSchema
from superset import is_feature_enabled, thumbnail_cache
from superset.charts.schemas import ChartEntityResponseSchema
from superset.commands.workspace.create import CreateWorkspaceCommand
from superset.commands.workspace.delete import DeleteWorkspaceCommand
from superset.commands.workspace.exceptions import (
    WorkspaceAccessDeniedError,
    WorkspaceCreateFailedError,
    WorkspaceDeleteFailedError,
    WorkspaceForbiddenError,
    WorkspaceInvalidError,
    WorkspaceNotFoundError,
    WorkspaceUpdateFailedError,
)
from superset.commands.dashboard.export import ExportDashboardsCommand
from superset.commands.dashboard.importers.dispatcher import ImportDashboardsCommand
from superset.commands.workspace.update import UpdateWorkspaceCommand
from superset.commands.importers.exceptions import NoValidFilesFoundError
from superset.commands.importers.v1.utils import get_contents_from_bundle
from superset.constants import MODEL_API_RW_METHOD_PERMISSION_MAP, RouteMethod
from superset.daos.workspace import WorkspaceDAO
from superset.dashboards.filters import (
    DashboardAccessFilter,
    DashboardCertifiedFilter,
    DashboardCreatedByMeFilter,
    DashboardFavoriteFilter,
    DashboardHasCreatedByFilter,
    DashboardTagFilter,
    DashboardTitleOrSlugFilter,
    FilterRelatedRoles,
)
from superset.workspace.filters import (
    WorkspaceAccessFilter,
    WorkspaceCreatedByMeFilter,
    WorkspaceTitleOrSlugFilter
)
from superset.dashboards.schemas import DashboardGetResponseSchema
from superset.workspace.schemas import (
    WorkspaceDatasetSchema,
    WorkspaceGetResponseSchema,
    WorkspacePostSchema,
    WorkspacePutSchema,
    get_delete_ids_schema,
    get_export_ids_schema,
    openapi_spec_methods_override,
    thumbnail_query_schema,
)
from superset.extensions import event_logger
from superset.models.workspace import Workspace
from superset.models.embedded_dashboard import EmbeddedDashboard
from superset.tasks.thumbnails import cache_dashboard_thumbnail
from superset.tasks.utils import get_current_user
from superset.utils.screenshots import DashboardScreenshot
from superset.utils.urls import get_url_path
from superset.views.base_api import (
    BaseSupersetModelRestApi,
    RelatedFieldFilter,
    requires_form_data,
    requires_json,
    statsd_metrics,
)
from superset.views.filters import (
    BaseFilterRelatedRoles,
    BaseFilterRelatedUsers,
    FilterRelatedOwners,
)


def with_workspace(
    f: Callable[[BaseSupersetModelRestApi, Workspace], Response]
) -> Callable[[BaseSupersetModelRestApi, str], Response]:
    """
    A decorator that looks up the workspace by id  and passes it to the api.
    Route must include an <id> parameter.
    Responds with 403 or 404 without calling the route, if necessary.
    """

    def wraps(self: BaseSupersetModelRestApi, id: int) -> Response:
        try:
            workspace = WorkspaceDAO.get_by_id_or_slug(id)
            return f(self, workspace)
        except WorkspaceAccessDeniedError:
            return self.response_403()
        except WorkspaceNotFoundError:
            return self.response_404()

    return functools.update_wrapper(wraps, f)


class WorkspaceRestApi(BaseSupersetModelRestApi):
    datamodel = SQLAInterface(Workspace)

    @before_request(only=["thumbnail"])
    def ensure_thumbnails_enabled(self) -> Optional[Response]:
        if not is_feature_enabled("THUMBNAILS"):
            return self.respone_404()
        return None

    include_route_methods = RouteMethod.REST_MODEL_VIEW_CRUD_SET | {
        RouteMethod.EXPORT,
        RouteMethod.IMPORT,
        RouteMethod.RELATED,
        "bulk_delete",
        "get_all",
        "get_charts",
        "get_dashboards",
        "get_datasets",
    }
    resource_name = "workspace"
    allow_browser_login = True
    class_permission_name = "Workspace"
    method_permission_name = MODEL_API_RW_METHOD_PERMISSION_MAP

    list_columns = [
        "id",
        "url",
        "changed_by.first_name",
        "changed_by.last_name",
        "changed_by.id",
        "changed_by_name",
        "created_by.first_name",
        "created_by.id",
        "created_by.last_name",
        "workspace_title",
        "owners.id",
        "owners.first_name",
        "owners.last_name",
        "roles.id",
        "roles.name",
        "tag",
    ]
    list_select_columns = list_columns + ["changed_on", "created_on", "changed_by_fk"]
    order_columns = [
        "changed_by.first_name",
        "created_by.first_name",
        "workspace_title",
        "changed_on",
    ]
    add_columns = [
        "workspace_title",
        "owners",
        "roles",
    ]
    edit_columns = add_columns
    search_columns = (
        "created_by",
        "changed_by",
        "workspace_title",
        "id",
        "owners",
        "roles",
        "tag",
    )
    search_filters = {
        "workspace_title":[WorkspaceTitleOrSlugFilter],
        "created_by": [WorkspaceCreatedByMeFilter]
    }
    base_order = ("changed_on", "desc")
    add_model_schema = WorkspacePostSchema()
    edit_model_schema = WorkspacePutSchema()
    chart_entity_response_schema = ChartEntityResponseSchema()
    workspace_get_response_schema = WorkspaceGetResponseSchema()
    workspace_dataset_schema = WorkspaceDatasetSchema()
    dataset_response_schema = DatasetSchema()
    dashboard_get_response_schema = DashboardGetResponseSchema()

    base_filters = [
        ["id", WorkspaceAccessFilter, lambda: []]
    ]
    base_related_field_filters = {
        "owners": [["id", BaseFilterRelatedUsers, lambda: []]],
        "created_by": [["id", BaseFilterRelatedUsers, lambda: []]],
        "roles": [["id", BaseFilterRelatedRoles, lambda: []]],
    }
    related_field_filters = {
        "owners": RelatedFieldFilter("first_name", FilterRelatedOwners),
        "roles": RelatedFieldFilter("name", FilterRelatedRoles),
        "created_by": RelatedFieldFilter("first_name", FilterRelatedOwners),
    }
    allowed_rel_fields = {"owners", "roles", "created_by", "changed_by"}
    openapi_spec_tag = "Workspace"
    """ Override the name set for this collection of endpoints """
    openapi_spec_component_schemas = (
        ChartEntityResponseSchema,
        WorkspaceDatasetSchema,
        WorkspacePutSchema,
        WorkspaceGetResponseSchema,
        WorkspacePostSchema,
    )
    apispec_parameter_schemas = {
        "get_delete_ids_schema": get_delete_ids_schema,
        "get_export_ids_schema": get_export_ids_schema,
        "thumbnail_query_schema": thumbnail_query_schema,
    }
    openapi_spec_methods = openapi_spec_methods_override
    """ Overrides GET methods OpenApi descriptions """
    def __repr__(self) -> str:
        """Deterministic string representation of the API instance for etag_cache."""
        # pylint: disable=consider-using-f-string
        return "Superset.workspace.api.WorkspaceRestApi@v{}{}".format(
            self.appbuilder.app.config["VERSION_STRING"],
            self.appbuilder.app.config["VERSION_SHA"],
        )

    @expose("/<id_or_slug>", methods=("GET",))
    @protect()
    @safe
    @statsd_metrics
    @with_workspace
    @event_logger.log_this_with_extra_payload
    # pylint: disable=arguments-differ,arguments-renamed
    def get(
        self,
        workspace: Workspace,
        add_extra_log_payload: Callable[..., None] = lambda **kwargs: None,
    ) -> Response:
        """Get a workspace.
        ---
        get:
          summary: Get a workspace
          parameters:
          - in: path
            schema:
              type: string
            name: id_or_slug
            description: Either the id of the workspace, or its slug
          responses:
            200:
              description: Workspace
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      result:
                        $ref: '#/components/schemas/WorkspaceGetResponseSchema'
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            403:
              $ref: '#/components/responses/403'
            404:
              $ref: '#/components/responses/404'
        """
        result = self.workspace_get_response_schema.dump(workspace)
        add_extra_log_payload(
            workspace_id=workspace.id, action=f"{self.__class__.__name__}.get"
        )
        return self.response(200, result=result)

    @expose("/<id_or_slug>/datasets", methods=("GET",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.get_datasets",
        log_to_statsd=False,
    )
    def get_datasets(self, id_or_slug: str) -> Response:
        """Get workspace's datasets.
        ---
        get:
          summary: Get workspace's datasets
          description: >-
            Returns a list of a workspace's datasets. Each dataset includes only
            the information necessary to render the workspace's charts.
          parameters:
          - in: path
            schema:
              type: string
            name: id_or_slug
            description: Either the id of the workspace, or its slug
          responses:
            200:
              description: Workspace dataset definitions
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      result:
                        type: array
                        items:
                          $ref: '#/components/schemas/WorkspaceDatasetSchema'
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            403:
              $ref: '#/components/responses/403'
            404:
              $ref: '#/components/responses/404'
        """
        try:
            datasets = WorkspaceDAO.get_datasets_for_workspace(id_or_slug)
            result = [
                self.workspace_dataset_schema.dump(dataset) for dataset in datasets
            ]
            return self.response(200, result=result)
        except (TypeError, ValueError) as err:
            return self.response_400(
                message=gettext(
                    "Dataset schema is invalid, caused by: %(error)s", error=str(err)
                )
            )
        except WorkspaceAccessDeniedError:
            return self.response_403()
        except WorkspaceNotFoundError:
            return self.response_404()


    @expose("/<id_or_slug>/charts", methods=("GET",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.get_charts",
        log_to_statsd=False,
    )
    def get_charts(self, id_or_slug: str) -> Response:
        """Get a workspace's chart definitions.
        ---
        get:
          summary: Get a workspace's chart definitions.
          parameters:
          - in: path
            schema:
              type: string
            name: id_or_slug
          responses:
            200:
              description: Workspace chart definitions
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      result:
                        type: array
                        items:
                          $ref: '#/components/schemas/ChartEntityResponseSchema'
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            403:
              $ref: '#/components/responses/403'
            404:
              $ref: '#/components/responses/404'
        """
        try:
            charts = WorkspaceDAO.get_charts_for_workspace(id_or_slug)
            result = [self.chart_entity_response_schema.dump(chart) for chart in charts]
            return self.response(200, result=result)
        except WorkspaceAccessDeniedError:
            return self.response_403()
        except WorkspaceNotFoundError:
            return self.response_404()

    @expose("/", methods=("POST",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.post",
        log_to_statsd=False,
    )
    @requires_json
    def post(self) -> Response:
        """Create a new workspace.
        ---
        post:
          summary: Create a new workspace
          requestBody:
            description: Workspace schema
            required: true
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/{{self.__class__.__name__}}.post'
          responses:
            201:
              description: Workspace added
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      id:
                        type: number
                      result:
                        $ref: '#/components/schemas/{{self.__class__.__name__}}.post'
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            404:
              $ref: '#/components/responses/404'
            500:
              $ref: '#/components/responses/500'
        """
        try:
            item = self.add_model_schema.load(request.json)
        # This validates custom Schema with custom validations
        except ValidationError as error:
            return self.response_400(message=error.messages)
        try:
            new_model = CreateWorkspaceCommand(item).run()
            return self.response(201, id=new_model.id, result=item)
        except WorkspaceInvalidError as ex:
            return self.response_422(message=ex.normalized_messages())
        except WorkspaceCreateFailedError as ex:
            logger.error(
                "Error creating model %s: %s",
                self.__class__.__name__,
                str(ex),
                exc_info=True,
            )
            return self.response_422(message=str(ex))

    @expose("/<pk>", methods=("PUT",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.put",
        log_to_statsd=False,
    )
    @requires_json
    def put(self, pk: int) -> Response:
        """Update a workspace.
        ---
        put:
          summary: Update a workspace
          parameters:
          - in: path
            schema:
              type: integer
            name: pk
          requestBody:
            description: Workspace schema
            required: true
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/{{self.__class__.__name__}}.put'
          responses:
            200:
              description: Workspace changed
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      id:
                        type: number
                      result:
                        $ref: '#/components/schemas/{{self.__class__.__name__}}.put'
                      last_modified_time:
                        type: number
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            403:
              $ref: '#/components/responses/403'
            404:
              $ref: '#/components/responses/404'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        try:
            item = self.edit_model_schema.load(request.json)
        # This validates custom Schema with custom validations
        except ValidationError as error:
            return self.response_400(message=error.messages)
        try:
            changed_model = UpdateWorkspaceCommand(pk, item).run()
            last_modified_time = changed_model.changed_on.replace(
                microsecond=0
            ).timestamp()
            response = self.response(
                200,
                id=changed_model.id,
                result=item,
                last_modified_time=last_modified_time,
            )
        except WorkspaceNotFoundError:
            response = self.response_404()
        except WorkspaceForbiddenError:
            response = self.response_403()
        except WorkspaceInvalidError as ex:
            return self.response_422(message=ex.normalized_messages())
        except WorkspaceUpdateFailedError as ex:
            logger.error(
                "Error updating model %s: %s",
                self.__class__.__name__,
                str(ex),
                exc_info=True,
            )
            response = self.response_422(message=str(ex))
        return response

    @expose("/<pk>", methods=("DELETE",))
    @protect()
    @safe
    @statsd_metrics
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.delete",
        log_to_statsd=False,
    )
    def delete(self, pk: int) -> Response:
        """Delete a workspace.
        ---
        delete:
          summary: Delete a workspace
          parameters:
          - in: path
            schema:
              type: integer
            name: pk
          responses:
            200:
              description: Workspace deleted
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      message:
                        type: string
            401:
              $ref: '#/components/responses/401'
            403:
              $ref: '#/components/responses/403'
            404:
              $ref: '#/components/responses/404'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        try:
            DeleteWorkspaceCommand([pk]).run()
            return self.response(200, message="OK")
        except WorkspaceNotFoundError:
            return self.response_404()
        except WorkspaceForbiddenError:
            return self.response_403()
        except WorkspaceDeleteFailedError as ex:
            logger.error(
                "Error deleting model %s: %s",
                self.__class__.__name__,
                str(ex),
                exc_info=True,
            )
            return self.response_422(message=str(ex))
