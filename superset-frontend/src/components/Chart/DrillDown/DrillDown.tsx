import {
  ContextMenuFilters,
  QueryFormData,
  URLDrillDownTypeEnum,
} from '@superset-ui/core';
import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Menu } from 'src/components/Menu';
import { MenuItemWithTruncation } from '../MenuItemWithTruncation';
import { drillToChartDown } from '../chartAction';
import { getSubmenuYOffset } from '../utils';

type Props = {
  type: URLDrillDownTypeEnum;
  title: string;
  formData: QueryFormData;
  filters?: ContextMenuFilters;
  contextMenuY?: number;
  submenuIndex?: number;
  isContextMenu?: boolean;
  onSelection?: () => void;
  onClick?: (event: MouseEvent) => void;
};

export const DrillDown = ({
  type,
  title,
  formData,
  filters,
  contextMenuY = 0,
  submenuIndex = 0,
  onSelection = () => null,
  onClick = () => null,
  ...props
}: Props) => {
  const dispatch = useDispatch();

  const drillToItems = useMemo(
    () => (formData.url_drillDowns || []).filter(item => item.type === type),
    [formData.url_drillDowns, type],
  );

  // Ensure submenu doesn't appear offscreen
  const submenuYOffset = useMemo(
    () =>
      getSubmenuYOffset(
        contextMenuY,
        drillToItems.length > 1 ? drillToItems.length + 1 : drillToItems.length,
        submenuIndex,
      ),
    [contextMenuY, drillToItems.length, submenuIndex],
  );

  const handleSelect = useCallback(
    (item, filters, e) => {
      onClick(e);
      onSelection();
      dispatch(drillToChartDown(formData.slice_id, item, filters));
    },
    [dispatch, onSelection, onClick, formData.slice_id],
  );

  return (
    <Menu.SubMenu
      {...props}
      popupOffset={[0, submenuYOffset]}
      popupClassName="chart-context-submenu"
      title={title}
    >
      <div data-test="drill-to-chart-submenu">
        {drillToItems.map((item, i) => (
          <MenuItemWithTruncation
            {...props}
            tooltipText={`${title}`}
            key={`drill-to-chart-${i}`}
            onClick={handleSelect.bind(null, item, filters)}
          >
            {item.label}
          </MenuItemWithTruncation>
        ))}
      </div>
    </Menu.SubMenu>
  );
};
