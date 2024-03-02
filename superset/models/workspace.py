from __future__ import annotations

import json
import logging
import uuid
from collections import defaultdict
from typing import Any, Callable

import sqlalchemy as sqla
from flask_appbuilder import Model
from flask_appbuilder.models.decorators import renders
from flask_appbuilder.security.sqla.models import User
from markupsafe import escape, Markup
from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.engine.base import Connection
from sqlalchemy.orm import relationship, subqueryload
from sqlalchemy.orm.mapper import Mapper
from sqlalchemy.sql.elements import BinaryExpression

from superset import app, db, is_feature_enabled, security_manager
from superset.connectors.sqla.models import BaseDatasource, SqlaTable
from superset.daos.datasource import DatasourceDAO
from superset.models.helpers import AuditMixinNullable, ImportExportMixin
from superset.models.slice import Slice
from superset.models.user_attributes import UserAttribute
from superset.tasks.thumbnails import cache_dashboard_thumbnail
from superset.tasks.utils import get_current_user
from superset.thumbnails.digest import get_dashboard_digest
from superset.utils import core as utils


metadata = Model.metadata  # pylint: disable=no-member
config = app.config
logger = logging.getLogger(__name__)


workspace_slices = Table(
    "workspace_slices", metadata, Column("id", Integer, primary_key=True),
    Column('workspace_id', Integer, ForeignKey("workspaces.id",ondelete='CASCADE')),
    Column('slice_id',Integer,ForeignKey('slice.id',ondelete="CASCADE")),
)

workspace_dashboards = Table(
    "workspace_dashboards", metadata, Column("id", Integer, primary_key=True),
    Column('workspace_id', Integer, ForeignKey("workspaces.id",ondelete='CASCADE')),
    Column('dashboard_id',Integer,ForeignKey('dashboards.id',ondelete="CASCADE")),
)

workspace_datasets = Table(
    "workspace_datasets", metadata, Column("id", Integer, primary_key=True),
    Column('workspace_id', Integer, ForeignKey("workspaces.id",ondelete='CASCADE')),
    Column('dataset_id',Integer,ForeignKey('datasets.id',ondelete="CASCADE")),
)

workspace_user = Table(
    'workspace_user',
    metadata,
    Column('id',Integer, primary_key=True),
    Column('user_id',Integer, ForeignKey('ab_user.id',ondelete='CASCADE')),
    Column('workspace_id',Integer, ForeignKey('workspaces.id',ondelete='CASCADE'))
)

WorkSpaceRoles = Table(
    'workspace_roles',
    metadata,
    Column('id',Integer, primary_key=True),
    Column(
        'workspace_id',Integer, ForeignKey('workspaces.id',ondelete='CASCADE'),
        nullable=False,
    ),
    Column(
        'role_id',
        Integer,
        ForeignKey('ab_role.id',ondelete='CASCADE'),
        nullable=True,
    ),
)


class WorkSpace(AuditMixinNullable, ImportExportMixin, Model, ):
    """The workspace object"""
    __tablename__ = 'workspaces'
    id = Column(Integer, primary_key=True)
    workspace_title = Column(String(500))
    description = Column(Text)
    tag = Column(String(500))

