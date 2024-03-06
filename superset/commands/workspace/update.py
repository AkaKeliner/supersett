import json
import logging
from typing import Any, Optional

from flask_appbuilder.models.sqla import Model
from marshmallow import ValidationError

from superset import security_manager
from superset.commands.base import BaseCommand, UpdateMixin
from superset.commands.workspace.exceptions import (
    WorkspaceForbiddenError,
    WorkspaceInvalidError,
    WorkspaceNotFoundError,
    WorkspaceUpdateFailedError,
    WorkspaceSlugExistsValidationError
)
from superset.commands.utils import populate_roles
from superset.daos.workspace import WorkspaceDAO
from superset.daos.exceptions import DAOUpdateFailedError
from superset.exceptions import SupersetSecurityException
from superset.extensions import db
from superset.models.workspace import Workspace

logger = logging.getLogger(__name__)


class UpdateWorkspaceCommand(UpdateMixin, BaseCommand):
    def __init__(self,model_id:int,data:dict[str,Any]):
        self._model_id = model_id
        self._properties = data.copy()
        self._model:Optional[Workspace] = None

    def run(self)->None:
        self.validate()
        assert self._model
        try:
            workspace = WorkspaceDAO.update(self._model,self._properties,commit=False)
        except DAOUpdateFailedError as ex:
            logger.exception(ex.exception)
            raise WorkspaceUpdateFailedError() from ex
        return workspace

    def validate(self) -> None:
        exceptions:list[ValidationError] = []
        owners_ids:Optional[list[int]] = self._properties.get('owners')
        roles_ids:Optional[list[int]] = self._properties.get('roles')
        slug: Optionalp[str] = self._properties.get('slug')
        self._model = WorkspaceDAO.get_by_id_or_slug(self._model_id)
        if not self._model:
            raise WorkspaceNotFoundError()
        try:
            security_manager.raise_for_ownership(self._model)
        except SupersetSecurityException as ex:
            raise WorkspaceForbiddenError() from ex
        if not WorkspaceDAO.validate_update_slug_uniqueness(self._model_id,slug):
            exceptions.append(WorkspaceSlugExistsValidationError())

        if owners_ids is None:
            owners_ids = [owner.id for owner in self._model.owners]
        try:
            owners = self.populate_owners(owners_ids)
            self._properties['owners'] = owners
        except ValidationError as ex:
            exceptions.append(ex)
        if exceptions:
            raise WorkspaceInvalidError(exceptions=exceptions)
        if roles_ids is None:
            roles_ids = [role.id for role in self._model.roles]
        try:
            roles = populate_roles(roles_ids)
            self._properties['roles'] = roles
        except ValidationError as ex:
            exceptions.append(ex)
        if exceptions:
            raise WorkspaceInvalidError(exceptions=exceptions)

