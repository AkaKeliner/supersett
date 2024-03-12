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
    WorkspaceUpdateFailedError,
)
from superset.daos.base import BaseDAO
from superset.dashboards.filters import DashboardAccessFilter, is_uuid
from superset.workspace.filters import WorkspaceAccessFilter
from superset.exceptions import SupersetSecurityException
from superset.extensions import db
from superset.models.core import FavStar, FavStarClassName
from superset.models.workspace import Workspace, id_or_slug_filter
from superset.models.embedded_dashboard import EmbeddedDashboard
from superset.models.slice import Slice
from superset.utils.core import get_user_id
from superset.utils.dashboard_filter_scopes_converter import copy_filter_scopes

logger = logging.getLogger(__name__)


class WorkspaceDAO(BaseDAO[Workspace]):
    base_filter = WorkspaceAccessFilter

    @classmethod
    def get_by_id_or_slug(cls, id_or_slug: int | str) -> Workspace:
        if is_uuid(id_or_slug):
            workspace = Workspace.get(id_or_slug)
        else:
            query = (
                db.session.query(Workspace)
                .filter(id_or_slug_filter(id_or_slug))
                .outerjoin(Workspace.owners)
                .outerjoint(Workspace.roles)
            )
            query = cls.base_filter("id", SQLAInterface(Workspace, db.session)).apply(
                query, None
            )
            workspace = query.one_or_none()

        if not workspace:
            raise WorkspaceNotFoundError
        try:
            workspace.raise_for_access()
        except SupersetSecurityException as ex:
            raise WorkspaceAccessDeniedError() from ex
        return workspace

    @staticmethod
    def get_datasets_for_workspace(id_or_slug: str) -> list[Any]:
        workspace = WorkspaceDAO.get_by_id_or_slug(id_or_slug)
        return workspace.get_datasets()

    @staticmethod
    def get_slices_for_workspace(id_or_slug: str) -> list[Any]:
        workspace = WorkspaceDAO.get_by_id_or_slug(id_or_slug)
        return workspace.get_slices()

    @staticmethod
    def get_dashboards_for_workspace(id_or_slug: str) -> list[Any]:
        workspace = WorkspaceDAO.get_by_id_or_slug(id_or_slug)
        return workspace.get_dashboards()

    @staticmethod
    def get_charts_for_workspace(id_or_slug: str) -> list[Slice]:
        return WorkspaceDAO.get_by_id_or_slug(id_or_slug).slice_objects

    @staticmethod
    def validate_slug_uniqueness(slug: str) -> bool:
        if not slug:
            return True
        workspace_query = db.session.query(Workspace).filter(Workspace.slug == slug)
        return not db.session.query(workspace_query.exists()).scalar()

    @staticmethod
    def validate_update_slug_uniqueness(workspace_id: int, slug: str | None) -> bool:
        if slug is not None:
            workspace_query = db.session.query(Workspace).filter(
                Workspace.slug == slug, Workspace.id != workspace_id
            )
            return not db.session.query(workspace_query.exists()).scalar()
        return True

    @staticmethod
    def update_workspace(
        workspace: Workspace, data: dict[Any, Any], commit: bool = False
    ) -> Workspace:
        try:
            for key, value in data.model_dump().items():
                if hasattr(workspace, key):
                    setattr(workspace, key, value)
        except Exception as e:
            raise WorkspaceUpdateFailedError() from e
        if commit:
            db.session.commit()
        return workspace
