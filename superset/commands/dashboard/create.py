# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
import logging
from typing import Any, Optional

from flask_appbuilder.models.sqla import Model
from marshmallow import ValidationError
from superset import  security_manager
from superset.commands.base import BaseCommand, CreateMixin
from superset.commands.dashboard.exceptions import (
    DashboardCreateFailedError,
    DashboardInvalidError,
    DashboardSlugExistsValidationError,
    WorkspacesForbiddenError,
    WorkspacesNotFoundValidationError,
)
from superset.commands.utils import populate_roles
from superset.daos.dashboard import DashboardDAO
from superset.daos.workspace import WorkspaceDAO
from superset.daos.exceptions import DAOCreateFailedError

logger = logging.getLogger(__name__)


class CreateDashboardCommand(CreateMixin, BaseCommand):
    def __init__(self, data: dict[str, Any]):
        self._properties = data.copy()

    def run(self) -> Model:
        self.validate()
        try:
            dashboard = DashboardDAO.create(attributes=self._properties, commit=True)
        except DAOCreateFailedError as ex:
            logger.exception(ex.exception)
            raise DashboardCreateFailedError() from ex
        return dashboard

    def validate(self) -> None:
        exceptions: list[ValidationError] = []
        owner_ids: Optional[list[int]] = self._properties.get("owners")
        role_ids: Optional[list[int]] = self._properties.get("roles")
        slug: str = self._properties.get("slug", "")
        workspace_ids = self._properties.get("workspaces",[])

        workspaces = WorkspaceDAO.find_by_ids(workspace_ids)
        if len(workspaces) != len(workspace_ids):
            exceptions.append(WorkspacesNotFoundValidationError())
        for work in workspaces:
            if not security_manager.is_owner(work):
                raise WorkspacesForbiddenError()
        self._workspaces['workspaces'] = workspaces

        # Validate slug uniqueness
        if not DashboardDAO.validate_slug_uniqueness(slug):
            exceptions.append(DashboardSlugExistsValidationError())

        try:
            owners = self.populate_owners(owner_ids)
            self._properties["owners"] = owners
        except ValidationError as ex:
            exceptions.append(ex)
        if exceptions:
            raise DashboardInvalidError(exceptions=exceptions)
        try:
            roles = populate_roles(role_ids)
            self._properties["roles"] = roles
        except ValidationError as ex:
            exceptions.append(ex)
        if exceptions:
            raise DashboardInvalidError(exceptions=exceptions)
