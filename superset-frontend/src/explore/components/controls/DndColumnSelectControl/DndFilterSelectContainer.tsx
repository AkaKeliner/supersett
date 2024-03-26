import React from 'react';
import { Metric, QueryFormMetric, styled, t } from '@superset-ui/core';
import { ColumnMeta, ControlType } from '@superset-ui/chart-controls';
// eslint-disable-next-line lodash/import-scope
import _ from 'lodash';
import { PlusOutlined } from '@ant-design/icons';
import { Button as AntBtn } from 'antd';
import { DndFilterSelect } from './DndFilterSelect';
import { Datasource } from '../../../types';
import Button from '../../../../components/Button';

enum conjuctionChoose {
  AND = 'and',
  OR = 'or',
}
// const mocData = {
//   hovered: false,
//   name: 'adhoc_filters',
//   label: 'Фильтры',
//   description: '',
//   validationErrors: [],
//   actions: {},
//   type: 'DndFilterSelect',
//   default: [],
//   provideFormDataToProps: true,
//   columns: [
//     {
//       advanced_data_type: null,
//       certification_details: null,
//       certified_by: null,
//       column_name: 'zipcode',
//       description: null,
//       expression: null,
//       filterable: true,
//       groupby: true,
//       id: 366,
//       is_certified: false,
//       is_dttm: false,
//       python_date_format: null,
//       type: 'BIGINT',
//       type_generic: 0,
//       verbose_name: null,
//       warning_markdown: null,
//     },
//     {
//       advanced_data_type: null,
//       certification_details: null,
//       certified_by: null,
//       column_name: 'population',
//       description: null,
//       expression: null,
//       filterable: true,
//       groupby: true,
//       id: 367,
//       is_certified: false,
//       is_dttm: false,
//       python_date_format: null,
//       type: 'BIGINT',
//       type_generic: 0,
//       verbose_name: null,
//       warning_markdown: null,
//     },
//     {
//       advanced_data_type: null,
//       certification_details: null,
//       certified_by: null,
//       column_name: 'area',
//       description: null,
//       expression: null,
//       filterable: true,
//       groupby: true,
//       id: 368,
//       is_certified: false,
//       is_dttm: false,
//       python_date_format: null,
//       type: 'DOUBLE PRECISION',
//       type_generic: 0,
//       verbose_name: null,
//       warning_markdown: null,
//     },
//     {
//       advanced_data_type: null,
//       certification_details: null,
//       certified_by: null,
//       column_name: 'contour',
//       description: null,
//       expression: null,
//       filterable: true,
//       groupby: true,
//       id: 369,
//       is_certified: false,
//       is_dttm: false,
//       python_date_format: null,
//       type: 'TEXT',
//       type_generic: 1,
//       verbose_name: null,
//       warning_markdown: null,
//     },
//   ],
//   savedMetrics: [
//     {
//       certification_details: null,
//       certified_by: null,
//       currency: null,
//       d3format: null,
//       description: null,
//       expression: 'COUNT(*)',
//       id: 12,
//       is_certified: false,
//       metric_name: 'count',
//       verbose_name: 'COUNT(*)',
//       warning_markdown: null,
//       warning_text: null,
//     },
//   ],
//   selectedMetrics: [],
//   datasource: {
//     always_filter_main_dttm: false,
//     cache_timeout: null,
//     column_formats: {},
//     columns: [
//       {
//         advanced_data_type: null,
//         certification_details: null,
//         certified_by: null,
//         column_name: 'zipcode',
//         description: null,
//         expression: null,
//         filterable: true,
//         groupby: true,
//         id: 366,
//         is_certified: false,
//         is_dttm: false,
//         python_date_format: null,
//         type: 'BIGINT',
//         type_generic: 0,
//         verbose_name: null,
//         warning_markdown: null,
//       },
//       {
//         advanced_data_type: null,
//         certification_details: null,
//         certified_by: null,
//         column_name: 'population',
//         description: null,
//         expression: null,
//         filterable: true,
//         groupby: true,
//         id: 367,
//         is_certified: false,
//         is_dttm: false,
//         python_date_format: null,
//         type: 'BIGINT',
//         type_generic: 0,
//         verbose_name: null,
//         warning_markdown: null,
//       },
//       {
//         advanced_data_type: null,
//         certification_details: null,
//         certified_by: null,
//         column_name: 'area',
//         description: null,
//         expression: null,
//         filterable: true,
//         groupby: true,
//         id: 368,
//         is_certified: false,
//         is_dttm: false,
//         python_date_format: null,
//         type: 'DOUBLE PRECISION',
//         type_generic: 0,
//         verbose_name: null,
//         warning_markdown: null,
//       },
//       {
//         advanced_data_type: null,
//         certification_details: null,
//         certified_by: null,
//         column_name: 'contour',
//         description: null,
//         expression: null,
//         filterable: true,
//         groupby: true,
//         id: 369,
//         is_certified: false,
//         is_dttm: false,
//         python_date_format: null,
//         type: 'TEXT',
//         type_generic: 1,
//         verbose_name: null,
//         warning_markdown: null,
//       },
//     ],
//     currency_formats: {},
//     database: {
//       allows_cost_estimate: null,
//       allows_subquery: true,
//       allows_virtual_table_explore: true,
//       backend: 'postgresql',
//       configuration_method: 'sqlalchemy_form',
//       disable_data_preview: false,
//       engine_information: {
//         disable_ssh_tunneling: false,
//         supports_file_upload: true,
//       },
//       explore_database_id: 1,
//       id: 1,
//       name: 'examples',
//       parameters: {},
//       parameters_schema: {
//         properties: {
//           database: {
//             description: 'Database name',
//             type: 'string',
//           },
//           encryption: {
//             description: 'Use an encrypted connection to the database',
//             type: 'boolean',
//           },
//           host: {
//             description: 'Hostname or IP address',
//             type: 'string',
//           },
//           password: {
//             description: 'Password',
//             nullable: true,
//             type: 'string',
//           },
//           port: {
//             description: 'Database port',
//             maximum: 65536,
//             minimum: 0,
//             type: 'integer',
//           },
//           query: {
//             additionalProperties: {},
//             description: 'Additional parameters',
//             type: 'object',
//           },
//           ssh: {
//             description: 'Use an ssh tunnel connection to the database',
//             type: 'boolean',
//           },
//           username: {
//             description: 'Username',
//             nullable: true,
//             type: 'string',
//           },
//         },
//         required: ['database', 'host', 'port', 'username'],
//         type: 'object',
//       },
//       schema_options: {},
//     },
//     datasource_name: 'sf_population_polygons',
//     default_endpoint: null,
//     description: 'Population density of San Francisco',
//     edit_url: '/tablemodelview/edit/5',
//     extra: null,
//     fetch_values_predicate: null,
//     filter_select: true,
//     filter_select_enabled: true,
//     granularity_sqla: [],
//     health_check_message: null,
//     id: 5,
//     is_sqllab_view: false,
//     main_dttm_col: null,
//     metrics: [
//       {
//         certification_details: null,
//         certified_by: null,
//         currency: null,
//         d3format: null,
//         description: null,
//         expression: 'COUNT(*)',
//         id: 12,
//         is_certified: false,
//         metric_name: 'count',
//         verbose_name: 'COUNT(*)',
//         warning_markdown: null,
//         warning_text: null,
//       },
//     ],
//     name: 'public.sf_population_polygons',
//     normalize_columns: false,
//     offset: 0,
//     order_by_choices: [
//       ['["area", true]', 'area [asc]'],
//       ['["area", false]', 'area [desc]'],
//       ['["contour", true]', 'contour [asc]'],
//       ['["contour", false]', 'contour [desc]'],
//       ['["population", true]', 'population [asc]'],
//       ['["population", false]', 'population [desc]'],
//       ['["zipcode", true]', 'zipcode [asc]'],
//       ['["zipcode", false]', 'zipcode [desc]'],
//     ],
//     owners: [],
//     params: null,
//     perm: '[examples].[sf_population_polygons](id:5)',
//     schema: 'public',
//     select_star: 'SELECT *\nFROM public.sf_population_polygons\nLIMIT 100',
//     sql: null,
//     table_name: 'sf_population_polygons',
//     template_params: null,
//     time_grain_sqla: [
//       ['PT1S', 'Second'],
//       ['PT1M', 'Minute'],
//       ['PT1H', 'Hour'],
//       ['P1D', 'Day'],
//       ['P1W', 'Week'],
//       ['P1M', 'Month'],
//       ['P3M', 'Quarter'],
//       ['P1Y', 'Year'],
//     ],
//     type: 'table',
//     uid: '5__table',
//     verbose_map: {
//       __timestamp: 'Time',
//       area: 'area',
//       contour: 'contour',
//       count: 'COUNT(*)',
//       population: 'population',
//       zipcode: 'zipcode',
//     },
//   },
//   value: [
//     {
//       id: 0,
//       path: [],
//       children: [
//         {
//           id: 2,
//           path: [],
//           children: [],
//           conjuction: 'and',
//           value: [
//             {
//               expressionType: 'SIMPLE',
//               subject: 'area',
//               operator: 'IN',
//               operatorId: 'IN',
//               comparator: [0.9],
//               clause: 'WHERE',
//               sqlExpression: null,
//               isExtra: false,
//               isNew: false,
//               datasourceWarning: false,
//               path: [],
//               children: [],
//               filterOptionName: 'filter_xmwtmnu2jdf_ijligkxpyrs',
//             },
//           ],
//         },
//         {
//           id: 4,
//           path: [],
//           children: [],
//           conjuction: 'or',
//           value: [
//             {
//               expressionType: 'SIMPLE',
//               subject: 'area',
//               operator: 'IN',
//               operatorId: 'IN',
//               comparator: [0.9],
//               clause: 'WHERE',
//               sqlExpression: null,
//               isExtra: false,
//               isNew: false,
//               datasourceWarning: false,
//               path: [0],
//               children: [],
//               filterOptionName: 'filter_xmwtmnu2jdf_ijligkxpyrs',
//             },
//           ],
//         },
//       ],
//       conjuction: 'or',
//       value: [
//         {
//           expressionType: 'SIMPLE',
//           subject: 'contour',
//           operator: 'IN',
//           operatorId: 'IN',
//           comparator: [
//             '[[-122.4513669, 37.7585757], [-122.4515531, 37.7594724], [-122.4485769, 37.7596486], [-122.4485345, 37.7590452], [-122.4480801, 37.7590905], [-122.447682, 37.7591898], [-122.4473949, 37.7593728], [-122.4471574, 37.7596607], [-122.4468662, 37.7604216], [-122.4465793, 37.7609016], [-122.4464336, 37.7610067], [-122.4464099, 37.7610943], [-122.4465297, 37.7613962], [-122.4467834, 37.7617814], [-122.446384, 37.7618164], [-122.4464014, 37.7620697], [-122.4463916, 37.762232], [-122.4462872, 37.7623102], [-122.4462466, 37.7622469], [-122.4461678, 37.7622193], [-122.4459306, 37.7622332], [-122.4458258, 37.7622641], [-122.445692, 37.762348], [-122.4446639, 37.7633265], [-122.4444117, 37.7639869], [-122.4434349, 37.7638756], [-122.4432475, 37.7636906], [-122.442951, 37.763678], [-122.4429498, 37.7641091], [-122.4431998, 37.7644689], [-122.4432153, 37.7645575], [-122.4432786, 37.7647262], [-122.4432633, 37.7652178], [-122.4433473, 37.7653328], [-122.4420867, 37.7653244], [-122.4419319, 37.7652951], [-122.4412417, 37.7652709], [-122.4395018, 37.7665755], [-122.4385554, 37.7662974], [-122.4383861, 37.7666647], [-122.4382914, 37.7667258], [-122.4378794, 37.7666108], [-122.4376847, 37.7665871], [-122.4374854, 37.7666443], [-122.4373338, 37.7667622], [-122.4372886, 37.766922], [-122.437299, 37.7672219], [-122.4364782, 37.7672747], [-122.4366252, 37.768919], [-122.4365883, 37.7690008], [-122.429128, 37.7694561], [-122.4289912, 37.7693942], [-122.426684, 37.7695336], [-122.4263094, 37.7696026], [-122.4269023, 37.7690494], [-122.4266932, 37.767869], [-122.4262285, 37.7630309], [-122.4262041, 37.7626312], [-122.4261493, 37.7622275], [-122.424923, 37.7494349], [-122.4381398, 37.7486367], [-122.4382461, 37.7486645], [-122.4406933, 37.748639], [-122.4414081, 37.74861], [-122.4419167, 37.7484744], [-122.442519, 37.7481832], [-122.4425842, 37.7480793], [-122.4431618, 37.7475044], [-122.4434534, 37.7474776], [-122.443486, 37.7483455], [-122.4434346, 37.7490916], [-122.4425989, 37.7491562], [-122.4425835, 37.7492668], [-122.4426934, 37.7504139], [-122.442777, 37.7506977], [-122.4428325, 37.751431], [-122.4428175, 37.7514541], [-122.4429828, 37.751545], [-122.442775, 37.7523784], [-122.4425243, 37.7523826], [-122.4424926, 37.7526067], [-122.4422391, 37.7528297], [-122.4420567, 37.7530708], [-122.4418864, 37.7533651], [-122.4418074, 37.753470899999996], [-122.4413075, 37.7538799], [-122.4411626, 37.7540904], [-122.4410758, 37.7541785], [-122.4408973, 37.7544926], [-122.4404496, 37.7550654], [-122.4401132, 37.7556063], [-122.4400321, 37.7557966], [-122.4400288, 37.755956499999996], [-122.4401339, 37.7564227], [-122.4402969, 37.7566523], [-122.4409751, 37.7568552], [-122.4413114, 37.756885], [-122.4418919, 37.7567079], [-122.4422268, 37.7566424], [-122.4423386, 37.756693], [-122.4425249, 37.7568328], [-122.4426183, 37.7569399], [-122.4429149, 37.7573605], [-122.443591, 37.7569732], [-122.4439333, 37.7567072], [-122.4446957, 37.7572241], [-122.4449643, 37.7572729], [-122.4449786, 37.7571994], [-122.4453147, 37.7565623], [-122.4456461, 37.7564495], [-122.4459464, 37.7564133], [-122.4469504, 37.7565504], [-122.4467773, 37.7562991], [-122.4463393, 37.7559114], [-122.4461257, 37.7558037], [-122.4459291, 37.7558301], [-122.4454641, 37.7559841], [-122.4452684, 37.7559206], [-122.4452215, 37.7557365], [-122.4453478, 37.7556189], [-122.4457815, 37.7555065], [-122.4461524, 37.7554645], [-122.4465603, 37.7553465], [-122.4468092, 37.7553493], [-122.4470041, 37.7554379], [-122.4475304, 37.7558212], [-122.4476829, 37.7558684], [-122.4478519, 37.7558206], [-122.4479616, 37.7556732], [-122.4479432, 37.7555315], [-122.4476986, 37.7548298], [-122.447376, 37.7542177], [-122.4472098, 37.7540429], [-122.4474508, 37.7539034], [-122.4475461, 37.7538158], [-122.4476562, 37.753773], [-122.4478428, 37.7537506], [-122.4479744, 37.7537011], [-122.4480754, 37.7536219], [-122.4481454, 37.7535002], [-122.4481418, 37.7533603], [-122.4480731, 37.7532259], [-122.447951, 37.7531203], [-122.4477071, 37.7527029], [-122.4475361, 37.752482], [-122.4477409, 37.7522887], [-122.4483455, 37.7519256], [-122.4484267, 37.7518144], [-122.448475, 37.751691], [-122.448479, 37.7515338], [-122.4485353, 37.7513025], [-122.44873, 37.7509019], [-122.4491851, 37.7506374], [-122.4493048, 37.7505472], [-122.4494233, 37.7504118], [-122.4496818, 37.7498231], [-122.4497165, 37.7495398], [-122.4496403, 37.7493141], [-122.4495431, 37.7491818], [-122.4494005, 37.749106], [-122.4492453, 37.749106], [-122.4490512, 37.7491828], [-122.4488851, 37.7493389], [-122.4482642, 37.7501683], [-122.4481335, 37.7502501], [-122.4479577, 37.7502702], [-122.4469244, 37.7499623], [-122.4458031, 37.7492963], [-122.4456578, 37.7491373], [-122.4456348, 37.7489827], [-122.4456966, 37.7488547], [-122.4459002, 37.7487609], [-122.4461463, 37.7487332], [-122.4463212, 37.7487819], [-122.4465134, 37.7488735], [-122.4471494, 37.7493387], [-122.4473477, 37.7494538], [-122.4475581, 37.7495127], [-122.4476957, 37.7494846], [-122.447794, 37.7494077], [-122.4482715, 37.7485861], [-122.4486493, 37.7479875], [-122.4487379, 37.7478161], [-122.4491457, 37.7468604], [-122.4493101, 37.7467156], [-122.4494466, 37.7466604], [-122.4496584, 37.7467905], [-122.4498294, 37.7468448], [-122.449121, 37.7484861], [-122.4503762, 37.7488366], [-122.4503784, 37.7491569], [-122.4503598, 37.7493693], [-122.4502786, 37.7498129], [-122.45012, 37.7503771], [-122.4500398, 37.7507895], [-122.4500202, 37.7511349], [-122.4498185, 37.7511708], [-122.4496577, 37.7512602], [-122.4495376, 37.7513982], [-122.4492226, 37.752826400000004], [-122.4491953, 37.7531415], [-122.4492117, 37.7533428], [-122.4492504, 37.7535472], [-122.4493386, 37.7537667], [-122.4495674, 37.7541398], [-122.4507089, 37.7536164], [-122.4507974, 37.7537662], [-122.4509406, 37.7538793], [-122.4511108, 37.7539312], [-122.4513603, 37.7539614], [-122.4515944, 37.7538988], [-122.4525703, 37.7535421], [-122.4527367, 37.7536662], [-122.4534108, 37.7538186], [-122.4542296, 37.7540621], [-122.4543099, 37.7541668], [-122.4541544, 37.7550294], [-122.4540894, 37.7552854], [-122.4536433, 37.7558571], [-122.4535124, 37.7561261], [-122.4533452, 37.756698], [-122.4535336, 37.7568195], [-122.4536174, 37.7569486], [-122.4537695, 37.7574679], [-122.4535943, 37.7576213], [-122.4533174, 37.7578196], [-122.4528348, 37.7580975], [-122.4513669, 37.7585757]]',
//           ],
//           clause: 'WHERE',
//           sqlExpression: null,
//           isExtra: false,
//           isNew: false,
//           datasourceWarning: false,
//           filterOptionName: 'filter_kmm31rapbzf_uv7plrj7zna',
//         },
//       ],
//     },
//     // {
//     //   id: 2,
//     //   path: [],
//     //   children: [
//     //     {
//     //       id: 2,
//     //       path: [],
//     //       children: [
//     //         {
//     //           id: 2,
//     //           path: [],
//     //           children: [],
//     //           conjuction: 'and',
//     //           value: [
//     //             {
//     //               expressionType: 'SIMPLE',
//     //               subject: 'area',
//     //               operator: 'IN',
//     //               operatorId: 'IN',
//     //               comparator: [2.74],
//     //               clause: 'WHERE',
//     //               sqlExpression: null,
//     //               isExtra: false,
//     //               isNew: false,
//     //               datasourceWarning: false,
//     //               path: [],
//     //               children: [],
//     //               filterOptionName: 'filter_9ldz9387rm_6arfbdvp0st',
//     //             },
//     //           ],
//     //         },
//     //         {
//     //           id: 2,
//     //           path: [],
//     //           children: [],
//     //           conjuction: 'and',
//     //           value: [
//     //             {
//     //               expressionType: 'SIMPLE',
//     //               subject: 'area',
//     //               operator: 'IN',
//     //               operatorId: 'IN',
//     //               comparator: [2.74],
//     //               clause: 'WHERE',
//     //               sqlExpression: null,
//     //               isExtra: false,
//     //               isNew: false,
//     //               datasourceWarning: false,
//     //               path: [],
//     //               children: [],
//     //               filterOptionName: 'filter_9ldz9387rm_6arfbdvp0st',
//     //             },
//     //           ],
//     //         },
//     //         {
//     //           id: 2,
//     //           path: [],
//     //           children: [],
//     //           conjuction: 'and',
//     //           value: [
//     //             {
//     //               expressionType: 'SIMPLE',
//     //               subject: 'area',
//     //               operator: 'IN',
//     //               operatorId: 'IN',
//     //               comparator: [2.74],
//     //               clause: 'WHERE',
//     //               sqlExpression: null,
//     //               isExtra: false,
//     //               isNew: false,
//     //               datasourceWarning: false,
//     //               path: [],
//     //               children: [],
//     //               filterOptionName: 'filter_9ldz9387rm_6arfbdvp0st',
//     //             },
//     //           ],
//     //         },
//     //       ],
//     //       conjuction: 'and',
//     //       value: [
//     //         {
//     //           expressionType: 'SIMPLE',
//     //           subject: 'area',
//     //           operator: 'IN',
//     //           operatorId: 'IN',
//     //           comparator: [2.74],
//     //           clause: 'WHERE',
//     //           sqlExpression: null,
//     //           isExtra: false,
//     //           isNew: false,
//     //           datasourceWarning: false,
//     //           path: [],
//     //           children: [],
//     //           filterOptionName: 'filter_9ldz9387rm_6arfbdvp0st',
//     //         },
//     //       ],
//     //     },
//     //     {
//     //       id: 2,
//     //       path: [],
//     //       children: [],
//     //       conjuction: 'and',
//     //       value: [
//     //         {
//     //           expressionType: 'SIMPLE',
//     //           subject: 'area',
//     //           operator: 'IN',
//     //           operatorId: 'IN',
//     //           comparator: [2.74],
//     //           clause: 'WHERE',
//     //           sqlExpression: null,
//     //           isExtra: false,
//     //           isNew: false,
//     //           datasourceWarning: false,
//     //           path: [],
//     //           children: [],
//     //           filterOptionName: 'filter_9ldz9387rm_6arfbdvp0st',
//     //         },
//     //       ],
//     //     },
//     //     {
//     //       id: 2,
//     //       path: [],
//     //       children: [],
//     //       conjuction: 'and',
//     //       value: [
//     //         {
//     //           expressionType: 'SIMPLE',
//     //           subject: 'area',
//     //           operator: 'IN',
//     //           operatorId: 'IN',
//     //           comparator: [2.74],
//     //           clause: 'WHERE',
//     //           sqlExpression: null,
//     //           isExtra: false,
//     //           isNew: false,
//     //           datasourceWarning: false,
//     //           path: [],
//     //           children: [],
//     //           filterOptionName: 'filter_9ldz9387rm_6arfbdvp0st',
//     //         },
//     //       ],
//     //     },
//     //   ],
//     //   conjuction: 'and',
//     //   value: [
//     //     {
//     //       expressionType: 'SIMPLE',
//     //       subject: 'area',
//     //       operator: 'IN',
//     //       operatorId: 'IN',
//     //       comparator: [2.74],
//     //       clause: 'WHERE',
//     //       sqlExpression: null,
//     //       isExtra: false,
//     //       isNew: false,
//     //       datasourceWarning: false,
//     //       path: [],
//     //       children: [],
//     //       filterOptionName: 'filter_9ldz9387rm_6arfbdvp0st',
//     //     },
//     //   ],
//     // },
//     // {
//     //   id: 46,
//     //   path: [],
//     //   children: [],
//     //   conjuction: 'or',
//     //   value: [
//     //     {
//     //       expressionType: 'SIMPLE',
//     //       subject: 'area',
//     //       operator: 'IN',
//     //       operatorId: 'IN',
//     //       comparator: [2.74],
//     //       clause: 'WHERE',
//     //       sqlExpression: null,
//     //       isExtra: false,
//     //       isNew: false,
//     //       datasourceWarning: false,
//     //       path: [],
//     //       children: [],
//     //       filterOptionName: 'filter_9ldz9387rm_6arfbdvp0st',
//     //     },
//     //   ],
//     // },
//   ],
// };

interface IValue {
  expressionType: string;
  subject: string;
  operator: string;
  operatorId: string;
  comparator: string[];
  clause: string;
  sqlExpression: string | null;
  isExtra: boolean;
  isNew: boolean;
  datasourceWarning: boolean;
  filterOptionName: string;
}

interface IDnDVal {
  id: string | number | null;
  path: string[];
  conjuction: string;
  children: IDnDVal[];
  value: IValue[];
}
interface IDndRenderFilters {
  onChange: (e: IDnDVal[]) => void;
  hovered: boolean;
  name: string;
  label: string;
  description: string;
  validationErrors: any[];
  actions: any;
  type: ControlType;
  default: any[];
  provideFormDataToProps: boolean;
  columns: ColumnMeta[];
  savedMetrics: Metric[];
  selectedMetrics: QueryFormMetric[];
  datasource: Datasource;
  value: IDnDVal[];
}

// @ts-ignore
interface IRender extends IDndRenderFilters, IDnDVal {}

const BtnContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  .ant-btn {
    margin: 6px 0 !important;
    width: 54px;
  }
  .ant-btn.left {
    border-radius: 4px 0 0 4px !important;
  }
  .ant-btn.right {
    border-radius: 0 4px 4px 0 !important;
  }
`;
const RenderFiltersContainer = styled.div`
  margin-left: 4px;
`;
const RenderInitFiltersContainer = styled.div`
  border-left: ${({ theme }) => `2px solid ${theme.colors.primary.dark1}`};
`;

const AddNewFilterBtn = styled.div`
  button {
    width: 100%;
    text-align: start;
  }
`;

const initFilter = {
  id: 0,
  path: [],
  conjuction: 'And',
  children: [],
  value: [],
};

const loop: (
  data: IDnDVal[],
  parentId: string | number | null,
  callback: (node: IDnDVal, i: number, data: IDnDVal[]) => void,
) => void = (
  data: IDnDVal[],
  parentId: string | number | null,
  callback: (node: IDnDVal, i: number, data: IDnDVal[]) => void,
  // eslint-disable-next-line consistent-return
) => {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < data.length; i++) {
    if (data[i]?.id === parentId) {
      return callback(data[i], i, data);
    }
    if (data[i]?.children) {
      loop(data[i].children!, parentId, callback);
    }
  }
};
const DndFilterSelectContainer = (globalProps: IDndRenderFilters) => {
  const { onChange = () => {}, value: values } = globalProps;
  console.log('DndFilterSelectContainer props', globalProps);
  const globalData = globalProps;

  // const changeConjuction = useCallback(
  //   (index: number) => {
  //     const valuesCopy = [...values];
  //     valuesCopy[index].conjuction =
  //       valuesCopy[index].conjuction === 'or' ? 'and' : 'or';
  //     // setValues(valuesCopy);
  //     onChange(valuesCopy);
  //   },
  //   [onChange, values],
  // );

  const onAddFilter = (parentId: string | number | null) => {
    if (!parentId) {
      values.push({ ...initFilter, id: _.uniqueId() });
    } else {
      loop(values, parentId, (node, i, data) => {
        if (node) {
          // eslint-disable-next-line no-param-reassign
          node.children = [
            ...node.children,
            { ...initFilter, id: _.uniqueId() },
          ];
        }
      });
    }

    onChange(values);
  };
  const onRemoveFilter = (id: string | number | null) => {
    const newValues = values.filter(f => f.id !== id);
    loop(values, id, (node, i, data) => {
      data.splice(i, 1);
    });
    onChange([...newValues]);
  };

  const renderButtons = (conjuction: string) => {
    const isAnd = conjuction === conjuctionChoose.AND;
    return (
      <BtnContainer>
        <Button className="left" buttonStyle={isAnd ? 'primary' : 'secondary'}>
          {t(conjuctionChoose.AND)}
        </Button>
        <Button
          className="right"
          buttonStyle={!isAnd ? 'primary' : 'secondary'}
        >
          {t(conjuctionChoose.OR)}
        </Button>
      </BtnContainer>
    );
  };
  const renderAddNewFilter = (id: string | number | null) => (
    <AddNewFilterBtn>
      <AntBtn
        type="dashed"
        size="small"
        style={{ width: '100%', textAlign: 'start' }}
        icon={<PlusOutlined />}
        onClick={() => onAddFilter(id)}
      >
        Add Filter
      </AntBtn>
    </AddNewFilterBtn>
  );
  const renderFilters = (props: IRender, isLast: boolean) => (
    <div>
      <RenderInitFiltersContainer>
        <DndFilterSelect {...props} onRemoveFilter={onRemoveFilter} />
        {props.children?.length
          ? props.children.map((el, index) => {
              const currentVal = { ...globalData, ...el, label: '' };
              const isLast: boolean = props.children?.length === index + 1;
              return (
                <RenderFiltersContainer>
                  {/*  @ts-ignore */}
                  {renderFilters(currentVal, isLast)}
                </RenderFiltersContainer>
              );
            })
          : ''}
      </RenderInitFiltersContainer>
      {renderAddNewFilter(props.id)}
      {!isLast ? renderButtons(props.conjuction) : ''}
    </div>
  );

  const globalLength = globalData.value?.length;

  return (
    <div>
      <div>{t(globalData.label)}</div>
      {!globalLength
        ? ''
        : globalData.value.map((el, index) => {
            const currentVal = { ...globalData, ...el, label: '' };
            const isLast: boolean = globalLength === index + 1;
            // @ts-ignore
            return <div>{renderFilters(currentVal, isLast)}</div>;
          })}
      {renderAddNewFilter(null)}
    </div>
  );
};

export default DndFilterSelectContainer;
