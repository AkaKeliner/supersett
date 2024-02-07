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

import React, { ReactNode, useContext, useMemo } from 'react';
import { isEmpty } from 'lodash';
import {
  Behavior,
  BinaryQueryObjectFilterClause,
  css,
  extractQueryFields,
  getChartMetadataRegistry,
  QueryFormData,
  t,
} from '@superset-ui/core';
import { Menu } from 'src/components/Menu';
import { useDispatch } from 'react-redux';
import { MenuItemTooltip } from '../DisabledMenuItemTooltip';
import { DashboardPageIdContext } from '../../../dashboard/containers/DashboardPage';
import { drilldownToChart, saveChartState } from '../chartAction';

const DisabledMenuItem = ({ children, ...props }: { children: ReactNode }) => (
  <Menu.Item disabled {...props}>
    <div
      css={css`
        white-space: normal;
        max-width: 160px;
      `}
    >
      {children}
    </div>
  </Menu.Item>
);
export type DrillDetailMenuItemsProps = {
  chartId: number;
  formData: QueryFormData;
  filters?: BinaryQueryObjectFilterClause[];
  isContextMenu?: boolean;
  contextMenuY?: number;
  onSelection?: () => void;
  onClick?: (event: MouseEvent) => void;
  submenuIndex?: number;
};
const DrillToChartMenuItems = ({
  chartId,
  formData,
  filters = [],
  isContextMenu = false,
  contextMenuY = 0,
  onSelection = () => null,
  onClick = () => null,
  submenuIndex = 0,
  ...props
}: DrillDetailMenuItemsProps) => {
  const dispatch = useDispatch();
  const dashboardPageId = useContext(DashboardPageIdContext);
  // const exploreUrl = useMemo(
  //   () => `/explore/?dashboard_page_id=${dashboardPageId}&slice_id=${chartId}`,
  //   [chartId, dashboardPageId],
  // );

  // const state = useSelector(state => state);
  const goToChart = () => {
    dispatch(saveChartState(chartId));
    // dispatch(drilldownToChart(chartKey, toChartKey, force, dashboardId));
    dispatch(drilldownToChart(137, 138, dashboardPageId));
  };

  // Check for Behavior.DRILL_TO_DETAIL to tell if plugin handles the `contextmenu`
  // event for dimensions.  If it doesn't, tell the user that drill to detail by
  // dimension is not supported.  If it does, and the `contextmenu` handler didn't
  // pass any filters, tell the user that they didn't select a dimension.
  const handlesDimensionContextMenu = useMemo(
    () =>
      getChartMetadataRegistry()
        .get(formData.viz_type)
        ?.behaviors.find(behavior => behavior === Behavior.DRILL_TO_DETAIL),
    [formData.viz_type],
  );

  // Check metrics to see if chart's current configuration lacks
  // aggregations, in which case Drill to Detail should be disabled.
  const noAggregations = useMemo(() => {
    const { metrics } = extractQueryFields(formData);
    return isEmpty(metrics);
  }, [formData]);

  let drillToDetailMenuItem;
  if (handlesDimensionContextMenu && noAggregations) {
    drillToDetailMenuItem = (
      <DisabledMenuItem {...props} key="drill-detail-no-aggregations">
        {t('Drill to chart')}
        <MenuItemTooltip
          title={t(
            'Drill to detail is disabled because this chart does not group data by dimension value.',
          )}
        />
      </DisabledMenuItem>
    );
  } else {
    drillToDetailMenuItem = (
      <Menu.Item {...props} key="drill-detail-no-filters" onClick={goToChart}>
        {t('Drill to chart by')}
      </Menu.Item>
    );
  }
  return <>{drillToDetailMenuItem}</>;
};

export default DrillToChartMenuItems;
