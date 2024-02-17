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
import {
  BinaryQueryObjectFilterClause,
  css,
  DDChart,
  QueryFormData,
  t,
} from '@superset-ui/core';
import { Menu } from 'src/components/Menu';
import { useDispatch } from 'react-redux';
import { MenuItemTooltip } from '../DisabledMenuItemTooltip';
import { DashboardPageIdContext } from '../../../dashboard/containers/DashboardPage';
import { drilldownToChart } from '../chartAction';
import {getSubmenuYOffset} from "../utils";
import {MenuItemWithTruncation} from "../MenuItemWithTruncation";

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
  drillToChart?: Array<DDChart>;
  drillToDashboards?: Array<DDChart>;
  formData: QueryFormData;
  filters?: BinaryQueryObjectFilterClause[];
  isContextMenu?: boolean;
  contextMenuY?: number;
  onSelection?: () => void;
  onClick?: (event: MouseEvent) => void;
  submenuIndex?: number;
};
const DrillToChartMenuItems = ({
                                   formData,
                                 drillToChart,
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
  const goToChart = (filter: DDChart) => {
    const filters = [];
    const field = filter.field === 'count' ? 'COUNT(*)' : filter.field;
    console.log('filter.value', filter.value)
    const filt = {
      col: field,
      op: "IN",
      val: typeof filter.value === 'string' || typeof filter.value === 'number' ? [filter.value] : filter.value
    };
    filters.push(filt);
    dispatch(drilldownToChart(filter.url, formData.slice_id, dashboardPageId, filters));
  };

  const submenuYOffset = useMemo(
    () =>
      getSubmenuYOffset(
        contextMenuY,
        filters.length > 1 ? filters.length + 1 : filters.length,
        submenuIndex,
      ),
    [contextMenuY, filters.length, submenuIndex],
  );
  let drillToDashboardMenuItem;
  if (!drillToChart?.length) {
    drillToDashboardMenuItem = (
      <DisabledMenuItem {...props} key="drill-detail-no-aggregations">
        {t('Drill to charts by')}
        <MenuItemTooltip title={t('Нет DD')} />
      </DisabledMenuItem>
    );
  } else {
    drillToDashboardMenuItem = (
      <Menu.SubMenu
        {...props}
        popupOffset={[0, submenuYOffset]}
        popupClassName="chart-context-submenu"
        title={t('Drill to charts by')}
      >
        {t('Drill to charts by')}
        <div data-test="drill-to-detail-by-submenu">
          {drillToChart.map((filter, i) => (
            <MenuItemWithTruncation
              {...props}
              key={`drill-detail-filter-${i}`}
              tooltipText={`${filter.title}`}
              onClick={() => goToChart(filter)}
            >
              {`${filter.title} `}
            </MenuItemWithTruncation>
          ))}
        </div>
      </Menu.SubMenu>
    );
  }
  return <>{drillToDashboardMenuItem}</>;
};

export default DrillToChartMenuItems;
