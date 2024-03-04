from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any

from flask import g
from flask_appbuilder.models.sqla.interface import SQLAInterface

from superset import is_feature_enabled, security_manager
from superset.commands.workspace.exceptions import (
    WorkspaceAccessDeniedError,
    WorkspaceForbiddenError,
    WorkspaceNotFoundError,
)
from superset.daos.base import BaseDAO
from superset.dashboards.filters import DashboardAccessFilter, is_uuid
from superset.exceptions import SupersetSecurityException
from superset.extensions import db
from superset.models.core import FavStar, FavStarClassName
from superset.models.dashboard import Dashboard, id_or_slug_filter
from superset.models.workspace import WorkSpace
from superset.models.embedded_dashboard import EmbeddedDashboard
from superset.models.slice import Slice
from superset.utils.core import get_user_id
from superset.utils.dashboard_filter_scopes_converter import copy_filter_scopes

logger = logging.getLogger(__name__)



class WorkspaceDAO(BaseDAO[WorkSpace]):
    @classmethod
    def get_by_id(cls, id_or_slug: int | str) -> WorkSpace:
        if is_uuid(id):
            workspace = WorkSpace.get(id)
        else:
            query = (db.session.query(WorkSpace)
                     .filter(WorkSpace.id==id))
            workspace = query.one_or_none()
        if not workspace:
            raise WorkspaceNotFoundError
        try:
            workspace.raise_for_access()
        except SupersetSecurityException as ex:
            raise WorkspaceAccessDeniedError() from ex
        return workspace
    @staticmethod
    def get_datasets_for_workspace(id: int) -> list[Any]:
        workspace = WorkspaceDAO.get_by_id(id)
        return workspace.get_datasets()

    @staticmethod
    def get_slices_for_workspace(id: int) -> list[Any]:
        workspace = WorkspaceDAO.get_by_id(id)
        return workspace.get_slices()

    @staticmethod
    def get_dashboards_for_workspace(id: int) -> list[Any]:
        workspace = WorkspaceDAO.get_by_id(id)
        return workspace.get_dashboards()
