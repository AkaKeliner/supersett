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
from typing import Optional

from flask_babel import lazy_gettext as _
from marshmallow.validate import ValidationError

from superset.commands.exceptions import (
    CommandInvalidError,
    CreateFailedError,
    DeleteFailedError,
    ForbiddenError,
    ImportFailedError,
    ObjectNotFoundError,
    UpdateFailedError,
)

class WorkspaceInvalidError(CommandInvalidError):
    message = _("Workspace parameters are invalid.")


class WorkspaceNotFoundError(ObjectNotFoundError):
    def __init__(
        self, workspace_id: Optional[str] = None, exception: Optional[Exception] = None
    ) -> None:
        super().__init__("Workspace", workspace_id, exception)


class WorkspaceCreateFailedError(CreateFailedError):
    message = _("Workspace could not be created.")

class WorkspaceUpdateFailedError(UpdateFailedError):
    message = _("Workspace could not be updated.")

class WorkspaceDeleteFailedError(DeleteFailedError):
    message = _("Workspace could not be deleted.")

class WorkspaceDeleteFailedReportsExistError(DashboardDeleteFailedError):
    message = _("There are associated alerts or reports")

class WorkspaceForbiddenError(ForbiddenError):
    message = _("Changing this Workspace is forbidden")

class WorkspaceImportError(ImportFailedError):
    message = _("Import Workspace failed for an unknown reason")

class WorkspaceAccessDeniedError(ForbiddenError):
    message = _("You don't have access to this workspace.")

class WorkspaceSlugExistsValidationError(ValidationError):
    """
    Marshmallow validation error for workspace slug already exists
    """

    def __init__(self) -> None:
        super().__init__([_("Must be unique")], field_name="slug")
