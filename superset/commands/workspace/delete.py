import logging
from typing import Optional

from flask_babel import lazy_gettext as _

from superset import security_manager
from superset.commands.base import BaseCommand
from superset.commands.workspace.exceptions import (
    WorkspaceDeleteFailedError,
    WorkspaceDeleteFailedReportsExistError,
    WorkspaceForbiddenError,
    WorkspaceNotFoundError,
)
from superset.daos.workspace import WorkspaceDAO
from superset.daos.exceptions import DAODeleteFailedError
from superset.daos.report import ReportScheduleDAO
from superset.exceptions import SupersetSecurityException
from superset.models.workspace import Workspace

logger = logging.getLogger(__name__)


class DeleteWorkspaceCommand(BaseCommand):
    def __init__(self,model_ids:list[int]):
        self._model_ids = model_ids
        self._models:Optional[list[Workspace]]=None

    def run(self)->None:
        self.validate()
        assert self._models
        try:
            WorkspaceDAO.delete(self._models)
        except DAODeleteFailedError as ex:
            logger.exception(ex.exception)
            raise WorkspaceDeleteFailedError() from ex

    def validate(self)->None:
        self._models = WorkspaceDAO.find_by_ids(self._model_ids)
        if not self._models or len(self._models) != len(self._model_ids):
            raise WorkspaceNotFoundError()
        if reports:= ReportScheduleDAO.find_by_workspace_id(self._model_ids):
            report_names = [report.name for report in reports]
            raise  WorkspaceDeleteFailedReportsExistError(
                _(f"There are associated alerts or reports: {','.join(report_names)}")
            )
        for model in self._models:
            try:
                security_manager.raise_for_ownership(model)
            except SupersetSecurityException as ex:
                raise  WorkspaceForbiddenError() from ex
