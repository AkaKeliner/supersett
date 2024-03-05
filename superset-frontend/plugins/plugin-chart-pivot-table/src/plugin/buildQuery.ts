/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  AdhocColumn,
  buildQueryContext,
  ensureIsArray,
  hasGenericChartAxes,
  isPhysicalColumn,
  PostProcessingRule,
  QueryFormColumn,
  QueryFormOrderBy,
  QueryObject,
} from '@superset-ui/core';
import { ownStateType, PivotTableQueryFormData } from '../types';

interface optionType {
  hooks: any;
  ownState: ownStateType;
}
export default function buildQuery(
  formData: PivotTableQueryFormData,
  options: optionType,
) {
  const { groupbyColumns = [], groupbyRows = [], extra_form_data } = formData;
  const time_grain_sqla =
    extra_form_data?.time_grain_sqla || formData.time_grain_sqla;

  // TODO: add deduping of AdhocColumns
  const columns = Array.from(
    new Set([
      ...ensureIsArray<QueryFormColumn>(groupbyColumns),
      ...ensureIsArray<QueryFormColumn>(groupbyRows),
    ]),
  ).map(col => {
    if (
      isPhysicalColumn(col) &&
      time_grain_sqla &&
      hasGenericChartAxes &&
      /* Charts created before `GENERIC_CHART_AXES` is enabled have a different
       * form data, with `granularity_sqla` set instead.
       */
      (formData?.temporal_columns_lookup?.[col] ||
        formData.granularity_sqla === col)
    ) {
      return {
        timeGrain: time_grain_sqla,
        columnType: 'BASE_AXIS',
        sqlExpression: col,
        label: col,
        expressionType: 'SQL',
      } as AdhocColumn;
    }
    return col;
  });

  return buildQueryContext(formData, baseQueryObject => {
    const { series_limit_metric, metrics, order_desc, orderby } =
      baseQueryObject;
    let orderBy: QueryFormOrderBy[] | undefined;
    if (series_limit_metric) {
      orderBy = [[series_limit_metric, !order_desc]];
    } else if (Array.isArray(metrics) && metrics[0]) {
      orderBy = [[metrics[0], !order_desc]];
    }
    const postProcessing: PostProcessingRule[] = [];
    const moreProps: Partial<QueryObject> = {};
    const ownState = options?.ownState ?? {};
    if (formData.server_pagination) {
      moreProps.row_limit = ownState.pageSize ?? formData.server_page_length;
      moreProps.row_offset =
        (ownState.currentPage ?? 0) * (ownState.pageSize ?? 0);
    }
    const queryObject = {
      ...baseQueryObject,
      columns,
      orderby,
      metrics,
      post_processing: postProcessing,
      ...moreProps,
    };
    const result = [
      {
        ...queryObject,
        orderby: orderBy,
        columns,
      },
    ];
    if (formData.server_pagination) {
      result.push({
        ...queryObject,
        row_limit: 0,
        row_offset: 0,
        post_processing: [],
        is_rowcount: true,
      });
    }
    return result;
  });
}
