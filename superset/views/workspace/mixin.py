from flask_babel import lazy_gettext as _

from superset import security_manager


class WorkspaceMixin:
    list_title = _("Workspaces")
    show_title = _("Show Workspace")
    add_title = _("Add Workspace")
    edit_title = _("Edit Workspace")

    list_columns = ["workspace_link", "creator", "published", "modified"]
    order_columns = ["workspace_link", "modified", "published"]
    edit_columns = [
        "workspace_title",
        "owners",
        "roles",
    ]
    show_columns = edit_columns + ["charts"]
    search_columns = ("workspace_title", "owners")
    add_columns = edit_columns
    base_order = ("changed_on", "desc")
    description_columns = {
        "owners": _("Owners is a list of users who can alter the workspace."),
        "roles": _(
            "Roles is a list which defines access to the workspace. "
            "Granting a role access to a workspace will bypass dataset level checks."
            "If no roles are defined, regular access permissions apply."
        ),
    }
    label_columns = {
        "workspace_link": _("Workspace"),
        "workspace_title": _("Title"),
        "charts": _("Charts"),
        "owners": _("Owners"),
        "roles": _("Roles"),
        "creator": _("Creator"),
        "modified": _("Modified"),
    }

    def pre_delete(self, item: "WorkspaceMixin") -> None:
        security_manager.raise_for_ownership(item)
