from typing import Any, Optional

from flask import g
from flask_appbuilder.security.sqla.models import Role
from flask_babel import lazy_gettext as _
from sqlalchemy import and_, or_
from sqlalchemy.orm.query import Query

from superset import db, is_feature_enabled, security_manager
from superset.connectors.sqla.models import SqlaTable
from superset.models.core import Database
from superset.models.workspace import Workspace
from superset.models.embedded_dashboard import EmbeddedDashboard
from superset.models.slice import Slice
from superset.security.guest_token import GuestTokenResourceType, GuestUser
from superset.utils.core import get_user_id
from superset.utils.filters import get_dataset_access_filters
from superset.views.base import BaseFilter
from superset.views.base_api import BaseFavoriteFilter, BaseTagFilter


class WorkspaceTitleOrSlugFilter(BaseFilter):
    name = _("Title or Slug")
    arg_name = "title_or_slug"
    def apply(self, query: Query, value: Any) -> Query:
        if not value:
            return query
        ilike_value = f"%{value}%"
        return query.filter(
            or_(
                Workspace.workspace_title.ilike(ilike_value),
                Workspace.slug.ilike(ilike_value),
            )
        )

class WorkspaceCreatedByMeFilter(BaseFilter):
    name = _("Created by me")
    arg_name = "workspace_created_by_me"

    def apply(self,query:Query,value:Any)->Query:
        return query.filter(
            or_(
                Workspace.created_by_fk == get_user_id(),
                Workspace.changed_by_fk == get_user_id(),
            )
        )


class WorkspaceAccessFilter(BaseFilter):
    def apply(self,query:Query,value:Any)->Query:
        if security_manager.is_admin():
            return query
        is_rbac_disabled_filter=[]
        workspace_has_roles=Workspace.roles.any()
        if is_feature_enabled('WORKSPACE_RBAC'):
            is_rbac_disabled_filter.append(~workspace_has_roles)
        datasource_perm_query=(
            db.session.query(Workspace.id)
            .join(Workspace.slice_objects, isouter=True)
            .join(SqlaTable, Slice.datasource_id==SqlaTable.id)
            .join(Database, SqlaTable.database_id==Database.id)
            .filter(
                and_(
                    *is_rbac_disabled_filter,
                    get_dataset_access_filters(
                        Slice,security_manager.can_access_all_datasources()
                    )
                )
            )
        )
        owner_ids_query=(
            db.session.query(Workspace.id)
            .join(Workspace.owners)
            .filter(security_manager.user_model.id == get_user_id())
        )
        feature_flagged_filters = []
        if is_feature_enabled("WORKSPACE_RBAC"):
            roles_based_query = (
                db.session.query(Workspace.id)
                .joint(Workspace.roles)
                .filter(
                    and_(
                        workspace_has_roles,
                        Role.id.in_([x.id for x in security_manager.get_user_roles()]),
                    )
                )
            )
            feature_flagged_filters.append(Workspace.id.in_(roles_based_query))
        query = query.filter(
            or_(
                Workspace.id.in_(owner_ids_query),
                Workspace.id.in_(datasource_perm_query),
                *feature_flagged_filters
            )
        )
        return query
