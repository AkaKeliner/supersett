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
import { MenuItemWithTruncation } from '../MenuItemWithTruncation';
import { getSubmenuYOffset } from '../utils';

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
const DrillToDashboardMenuItems = ({
  formData,
                                     drillToDashboards,
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
    // dispatch(saveChartState(chartId));
    // dispatch(drilldownToChart(chartKey, toChartKey, force, dashboardId));
    dispatch(drilldownToChart(137, 138, dashboardPageId));
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
  if (!drillToDashboards?.length) {
    drillToDashboardMenuItem = (
      <DisabledMenuItem {...props} key="drill-detail-no-aggregations">
        {t('Drill to dashboard by')}
        <MenuItemTooltip title={t('Нет DD')} />
      </DisabledMenuItem>
    );
  } else {
    drillToDashboardMenuItem = (
      <Menu.SubMenu
        {...props}
        popupOffset={[0, submenuYOffset]}
        popupClassName="chart-context-submenu"
        title={t('Drill to dashboard by')}
      >
        {t('Drill to dashboard by')}
        <div data-test="drill-to-detail-by-submenu">
          {drillToDashboards.map((filter, i) => (
            <MenuItemWithTruncation
              {...props}
              key={`drill-detail-filter-${i}`}
              tooltipText={`${filter.title}`}
              onClick={goToChart}
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

export default DrillToDashboardMenuItems;
