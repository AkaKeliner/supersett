import json
import re
from typing import Any, Union

from marshmallow import fields, post_dump, post_load, pre_load, Schema
from marshmallow.validate import Length, ValidationError

from superset import security_manager
from superset.exceptions import SupersetException
from superset.tags.models import TagType
from superset.utils import core as utils


get_delete_ids_schema = {"type": "array", "items": {"type": "integer"}}
get_export_ids_schema = {"type": "array", "items": {"type": "integer"}}
get_fav_star_ids_schema = {"type": "array", "items": {"type": "integer"}}
thumbnail_query_schema = {
    "type": "object",
    "properties": {"force": {"type": "boolean"}},
}
workspace_title_description = "A title for the workspace"
slug_description = "Unique identifying part for the web address of the workspace."
owners_description = (
    "Owner are users ids allowed to delete or change this workspace. "
    "If left empty you will be one of the owners of the workspace."
)
roles_description = (
    "Roles is a list which defines access to the workspace. "
    "These roles are always applied in addition to restrictions on dataset "
    "level access. "
    "If no roles defined then the workspace is available to all roles."
)
json_metadata_description = (
    "This JSON object is generated dynamically when clicking "
    "the save or overwrite button in the workspace view. "
    "It is exposed here for reference and for power users who may want to alter "
    " specific parameters."
)
charts_objects_description = (
    "The names of the workspace's charts. Names are used for legacy reasons."
)
datasets_objects_description = (
    "The names of the workspace's datasets. Names are used for legacy reasons."
)
dashboards_objects_description = (
    "The names of the workspace's dashboards. Names are used for legacy reasons."
)
openapi_spec_methods_override = {
    "get": {"get": {"summary": "Get a workspace detail information"}},
    "get_list": {
        "get": {
            "summary": "Get a list of workspace",
            "description": "Gets a list of workspace, use Rison or JSON query "
            "parameters for filtering, sorting, pagination and "
            " for selecting specific columns and metadata.",
        }
    },
    "info": {"get": {"summary": "Get metadata information about this API resource"}},
    "related": {
        "get": {"description": "Get a list of all possible owners for a workspace."}
    },
}


def validate_json(value: Union[bytes, bytearray, str]) -> None:
    try:
        utils.validate_json(value)
    except SupersetException as ex:
        raise ValidationError("JSON not valid") from ex


def validate_json_metadata(value: Union[bytes, bytearray, str]) -> None:
    if not value:
        return
    try:
        value_obj = json.loads(value)
    except json.decoder.JSONDecodeError as ex:
        raise ValidationError("JSON not valid") from ex
    errors = WorkspaceJSONMetadataSchema().validate(value_obj, partial=False)
    if errors:
        raise ValidationError(errors)


class WorkspaceJSONMetadataSchema(Schema):
    # native_filter_configuration is for workspace-native filters
    native_filter_configuration = fields.List(fields.Dict(), allow_none=True)
    # chart_configuration for now keeps data about cross-filter scoping for charts
    chart_configuration = fields.Dict()
    # global_chart_configuration keeps data about global cross-filter scoping
    # for charts - can be overridden by chart_configuration for each chart
    global_chart_configuration = fields.Dict()
    timed_refresh_immune_slices = fields.List(fields.Integer())
    # deprecated wrt dashboard-native filters
    filter_scopes = fields.Dict()
    expanded_slices = fields.Dict()
    refresh_frequency = fields.Integer()
    # deprecated wrt dashboard-native filters
    default_filters = fields.Str()
    stagger_refresh = fields.Boolean()
    stagger_time = fields.Integer()
    color_scheme = fields.Str(allow_none=True)
    color_namespace = fields.Str(allow_none=True)
    positions = fields.Dict(allow_none=True)
    label_colors = fields.Dict()
    shared_label_colors = fields.Dict()
    color_scheme_domain = fields.List(fields.Str())
    cross_filters_enabled = fields.Boolean(dump_default=True)
    # used for v0 import/export
    import_time = fields.Integer()
    remote_id = fields.Integer()
    filter_bar_orientation = fields.Str(allow_none=True)
    native_filter_migration = fields.Dict()

    @pre_load
    def remove_show_native_filters(  # pylint: disable=unused-argument
        self,
        data: dict[str, Any],
        **kwargs: Any,
    ) -> dict[str, Any]:

        if "show_native_filters" in data:
            del data["show_native_filters"]
        return data


class UserSchema(Schema):
    id = fields.Int()
    username = fields.String()
    first_name = fields.String()
    last_name = fields.String()


class RolesSchema(Schema):
    id = fields.Int()
    name = fields.String()


class WorkspaceGetResponseSchema(Schema):
    id = fields.Int()
    slug = fields.String()
    url = fields.String()
    workspace_title = fields.String(
        metadata={"description": workspace_title_description}
    )
    changed_by_name = fields.String()
    changed_by = fields.Nested(UserSchema(exclude=["username"]))
    changed_on = fields.DateTime()
    charts = fields.List(fields.String(metadata={"description": charts_objects_description}))
    dashboards = fields.List(
        fields.String(metadata={"description": dashboards_objects_description})
    )
    datasets = fields.List(
        fields.String(metadata={"description": datasets_objects_description})
    )
    owners = fields.List(fields.Nested(UserSchema(exclude=["username"])))
    roles = fields.List(fields.Nested(RolesSchema))

    @post_dump()
    def post_dump(self, serialized: dict[str, Any], **kwargs: Any) -> dict[str, Any]:
        if security_manager.is_guest_user():
            del serialized["owners"]
            del serialized["changed_by_name"]
            del serialized["changed_by"]
        return serialized


class DatabaseSchema(Schema):
    id = fields.Int()
    name = fields.String()
    backend = fields.String()
    allows_subquery = fields.Bool()
    allows_cost_estimate = fields.Bool()
    allows_virtual_table_explore = fields.Bool()
    disable_data_preview = fields.Bool()
    explore_database_id = fields.Int()


class WorkspaceDatasetSchema(Schema):
    id = fields.Int()
    uid = fields.Str()
    column_formats = fields.Dict()
    currency_formats = fields.Dict()
    database = fields.Nested(DatabaseSchema)
    default_endpoint = fields.String()
    filter_select = fields.Bool()
    filter_select_enabled = fields.Bool()
    is_sqllab_view = fields.Bool()
    name = fields.Str()
    datasource_name = fields.Str()
    table_name = fields.Str()
    type = fields.Str()
    schema = fields.Str()
    offset = fields.Int()
    cache_timeout = fields.Int()
    params = fields.Str()
    perm = fields.Str()
    edit_url = fields.Str()
    sql = fields.Str()
    select_star = fields.Str()
    main_dttm_col = fields.Str()
    health_check_message = fields.Str()
    fetch_values_predicate = fields.Str()
    template_params = fields.Str()
    owners = fields.List(fields.Dict())
    columns = fields.List(fields.Dict())
    column_types = fields.List(fields.Int())
    metrics = fields.List(fields.Dict())
    order_by_choices = fields.List(fields.List(fields.Str()))
    verbose_map = fields.Dict(fields.Str(), fields.Str())
    time_grain_sqla = fields.List(fields.List(fields.Str()))
    granularity_sqla = fields.List(fields.List(fields.Str()))
    normalize_columns = fields.Bool()
    always_filter_main_dttm = fields.Bool()

    @post_dump()
    def post_dump(self, serialized: dict[str, Any], **kwargs: Any) -> dict[str, Any]:
        if security_manager.is_guest_user():
            del serialized["owners"]
            del serialized["database"]
        return serialized


class BaseWorkspaceSchema(Schema):
    @post_load
    def post_load(self, data: dict[str, Any], **kwargs: Any) -> dict[str, Any]:
        if data.get("slug"):
            data["slug"] = data["slug"].strip()
            data["slug"] = data["slug"].replace(" ", "-")
            data["slug"] = re.sub(r"[^\w\-]+", "", data["slug"])
        return data


class WorkspacePostSchema(Schema):
    workspace_title = fields.String(
        metadata={"description": workspace_title_description},
        allow_none=True,
        validate=Length(0, 500),
    )
    slug = fields.String(
        metadata={"description": slug_description},
        allow_none=True,
        validate=[Length(1, 255)],
    )
    owners = fields.List(fields.Integer(metadata={"description": owners_description}))
    roles = fields.List(fields.Integer(metadata={"description": roles_description}))
    external_url = fields.String(allow_none=True)

class WorkspacePutSchema(BaseWorkspaceSchema):
    workspace_title = fields.String(
        metadata={"description": workspace_title_description},
        allow_none=True,
        validate=Length(0, 500),
    )
    slug = fields.String(
        metadata={"description": slug_description},
        allow_none=True,
        validate=Length(0, 255),
    )
    owners = fields.List(
        fields.Integer(metadata={"description": owners_description}, allow_none=True)
    )
    roles = fields.List(
        fields.Integer(metadata={"description": roles_description}, allow_none=True)
    )
    external_url = fields.String(allow_none=True)
