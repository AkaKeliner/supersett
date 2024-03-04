import logging
from typing import Any, Optional

from flask_appbuilder.models.sqla import Model
from marshmallow import ValidationError

from superset.commands.base import BaseCommand, CreateMixin
from superset.commands.workspace.exceptions import (
    WorkspaceCreateFailedError,
    WorkspaceInvalidError,
)
from superset.commands.utils import populate_roles
from superset.daos.workspace import WorkspaceDAO
from superset.daos.exceptions import DAOCreateFailedError

logger = logging.getLogger(__name__)

class CreateWorkspaceCommand(CreateMixin, BaseCommand):
    def __init__(self,data:dict[str,Any]):
        self._properties = data.copy()

    def run(self) -> Model:
        self.validate()
        try:
            workspace = WorkspaceDAO.create(attributes=self._properties,commit=True)
        except DAOCreateFailedError as ex:
            logger.exception(ex.exception)
            raise WorkspaceCreateFailedError() from ex
        return workspace

    def validate(self) -> None:
        exceptions: list[ValidationError] = []
        owner_ids: Optional[list[int]] = self._properties.get('owners')
        role_ids: Optional[list[int]] = self._properties.get('roles')
        try:
            owners = self.populate_owners(owner_ids)
            self._properties['owners'] = owners
        except ValidationError as ex:
            exceptions.append(ex)
        if exceptions:
            raise WorkspaceInvalidError(exceptions=exceptions)

        try:
            roles = populate_roles(role_ids)
            self._properties['roles'] = roles
        except ValidationError as ex:
            exceptions.append(ex)
        if exceptions:
            raise WorkspaceInvalidError(exceptions=exceptions)
