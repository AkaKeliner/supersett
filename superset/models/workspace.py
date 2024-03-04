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
from sqlalchemy_mptt import BaseNestedSets
from superset import app, db, is_feature_enabled, security_manager
from superset.connectors.sqla.models import BaseDatasource, SqlaTable
from superset.daos.datasource import DatasourceDAO
from superset.models.helpers import AuditMixinNullable, ImportExportMixin
from superset.models.slice import Slice
from superset.models.dashboard import Dashboard
from superset.datasets.models import Dataset
from superset.models.user_attributes import UserAttribute
from superset.tasks.thumbnails import cache_dashboard_thumbnail
from superset.tasks.utils import get_current_user
from superset.thumbnails.digest import get_dashboard_digest
from superset.utils import core as utils


metadata = Model.metadata  # pylint: disable=no-member
config = app.config
logger = logging.getLogger(__name__)


workspace_slices = Table(
    "workspace_slices",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("workspace_id", Integer, ForeignKey("workspaces.id", ondelete="CASCADE")),
    Column("slice_id", Integer, ForeignKey("slices.id", ondelete="CASCADE")),
)

workspace_dashboards = Table(
    "workspace_dashboards",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("workspace_id", Integer, ForeignKey("workspaces.id", ondelete="CASCADE")),
    Column("dashboard_id", Integer, ForeignKey("dashboards.id", ondelete="CASCADE")),
)

workspace_datasets = Table(
    "workspace_datasets",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("workspace_id", Integer, ForeignKey("workspaces.id", ondelete="CASCADE")),
    Column("dataset_id", Integer, ForeignKey("sl_datasets.id", ondelete="CASCADE")),
)

workspace_user = Table(
    "workspace_user",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("ab_user.id", ondelete="CASCADE")),
    Column("workspace_id", Integer, ForeignKey("workspaces.id", ondelete="CASCADE")),
)

WorkSpaceRoles = Table(
    "workspace_roles",
    metadata,
    Column("id", Integer, primary_key=True),
    Column(
        "workspace_id",
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    ),
    Column(
        "role_id",
        Integer,
        ForeignKey("ab_role.id", ondelete="CASCADE"),
        nullable=True,
    ),
)


class WorkSpace(AuditMixinNullable, ImportExportMixin, Model, BaseNestedSets):
    """The workspace object"""

    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True)
    workspace_title = Column(String(500))
    description = Column(Text)
    tag = Column(String(500))
    dashboard_objects:list[Dashboard] = relationship(
        Dashboard, secondary=workspace_dashboards, backref="workspaces"
    )
    slice_objects:list[Slice] = relationship(Slice, secondary=workspace_slices, backref="workspaces")
    dataset_objects:list[Dataset] = relationship(
        Dataset, secondary=workspace_datasets, backref="workspaces"
    )
    owners = relationship(
        security_manager.user_model,
        secondary=workspace_user,
        passive_deletes=True,
    )
    roles = relationship(security_manager.role_model, secondary=WorkSpaceRoles)
    export_fields = ["workspace_title", "description", "tag"]

    def __repr__(self) -> str:
        return f"<Workspace id={self.id} title= {self.workspace_title}>"

    @property
    def url(self) -> str:
        return f"/superset/workspace/{self.id}/"

    @staticmethod
    def get_url(id_: int, slug: str | None = None) -> str:
        # To be able to generate URL's without instantiating a Dashboard object
        return f"/superset/workspace/{id_}/"

    @property
    def datasources(self) -> set[BaseDatasource]:
        # Verbose but efficient database enumeration of dashboard datasources.
        datasources_by_cls_model: dict[type[BaseDatasource], set[int]] = defaultdict(
            set
        )
        datasources = set()
        for slc in self.slice_objects:
            datasources_by_cls_model[slc.cls_model].add(slc.datasource_id)

        for cls_model, datasource_ids in datasources_by_cls_model.items():
            datasources.update(
                db.session.query(cls_model)
                .filter(cls_model.id.in_(datasource_ids))
                .all()
            )


        # return {
        #     datasource
        #     for cls_model, datasource_ids in datasources_by_cls_model.items()
        #     for datasource in db.session.query(cls_model)
        #     .filter(cls_model.id.in_(datasource_ids))
        #     .all()
        # }
        return datasources

    @property
    def charts(self) -> list[str]:
        return [slc.chart for slc in self.slice_objects]

    @property
    def sqla_metadata(self) -> None:
        # pylint: disable=no-member
        with self.get_sqla_engine_with_context() as engine:
            meta = MetaData(bind=engine)
            meta.reflect()

    @property
    def data(self) -> dict[str, Any]:

        return {
            "id": self.id,
            "metadata": self.params_dict,
            "workspace_title": self.workspace_title,
            "description":self.description,
            "tag":self.tag,
            "slices": [slc.data for slc in self.slices],
            "dashboards":[dshbrd.data for dshbrd in self.dashboard_objects],
            'datasets':[dataset.to_json() for dataset in self.dataset_objects]
        }

    @property
    def params(self) -> str:
        return self.json_metadata

    @params.setter
    def params(self, value: str) -> None:
        self.json_metadata = value


    @classmethod
    def get(cls, id: str | int) -> Dashboard:
        qry = db.session.query(WorkSpace).filter(id_or_slug_filter(id))
        return qry.one_or_none()

    def raise_for_access(self) -> None:
        """
        Raise an exception if the user cannot access the resource.

        :raises SupersetSecurityException: If the user cannot access the resource
        """

        security_manager.raise_for_access(dashboard=self)
