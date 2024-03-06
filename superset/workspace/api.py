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
from superset.daos.workspace import WorkspaceDAO, EmbeddedDashboardDAO
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
