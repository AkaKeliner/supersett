import builtins
import json
import re
from typing import Callable, Union

from flask import g, redirect, request, Response
from flask_appbuilder import expose
from flask_appbuilder.actions import action
from flask_appbuilder.models.sqla.interface import SQLAInterface
from flask_appbuilder.security.decorators import has_access
from flask_babel import gettext as __, lazy_gettext as _
from flask_login import AnonymousUserMixin, login_user

from superset import db, event_logger, is_feature_enabled, security_manager
from superset.constants import MODEL_VIEW_RW_METHOD_PERMISSION_MAP, RouteMethod
from superset.models.workspace import Workspace as WorkspaceModel
from superset.superset_typing import FlaskResponse
from superset.utils import core as utils
from superset.views.base import (
    BaseSupersetView,
    common_bootstrap_payload,
    DeleteMixin,
    generate_download_headers,
    SupersetModelView,
)
from superset.views.workspace.mixin import WorkspaceMixin


class WorkspaceModelView(WorkspaceMixin, SupersetModelView, DeleteMixin):
    route_base = "/workspace"
    datamodel = SQLAInterface(WorkspaceModel)
    class_permission_name = "Workspace"
    method_permission_name = MODEL_VIEW_RW_METHOD_PERMISSION_MAP

    include_route_methods = RouteMethod.CRUD_SET | {
        RouteMethod.API_READ,
        RouteMethod.API_DELETE,
    }

    @has_access
    @expose("/list/")
    def list(self) -> FlaskResponse:
        return super().render_app_template()

    def pre_add(self, item: "WorkspaceModelView") -> None:
        if g.user not in item.owners:
            item.owners.append(g.user)
        for slc in item.slices:
            slc.owners = list(set(item.owners) | set(slc.owners))

    def pre_update(self, item: "WorkspaceModelView") -> None:
        security_manager.raise_for_ownership(item)
        self.pre_add(item)


class Workspace(BaseSupersetView):
    """The base view for Superset"""

    class_permission_name = "Workspace"
    method_permission_name = MODEL_VIEW_RW_METHOD_PERMISSION_MAP

    @has_access
    @expose("/new/")
    def new(self) -> FlaskResponse:
        """Creates a new, blank workspace and redirects to it in edit mode"""
        new_workspace = WorkspaceModel(
            workspace_title="[ untitled workspace ]",
            owners=[g.user],
        )
        db.session.add(new_workspace)
        db.session.commit()
        return redirect(f"/superset/workspace/{new_workspace.id}/?edit=true")
