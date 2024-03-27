import {
  ContextMenuFilters,
  QueryFormData,
  DrillDownType,
} from '@superset-ui/core';
import React, { useMemo } from 'react';
import { Menu } from 'src/components/Menu';
import { MenuItemWithTruncation } from '../MenuItemWithTruncation';
import { getSubmenuYOffset } from '../utils';

type Props = {
  type: DrillDownType;
  title: string;
  formData: QueryFormData;
  filters: ContextMenuFilters['hierarchy'];
  contextMenuY?: number;
  submenuIndex?: number;
  isContextMenu?: boolean;
  onSelection?: () => void;
  onClick?: (event: MouseEvent) => void;
};

export const Hierarchy = ({
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
  const subMenuItems = useMemo(() => [], []);

  // Ensure submenu doesn't appear offscreen
  const submenuYOffset = useMemo(
    () =>
      getSubmenuYOffset(
        contextMenuY,
        subMenuItems.length > 1 ? subMenuItems.length + 1 : subMenuItems.length,
        submenuIndex,
      ),
    [contextMenuY, subMenuItems.length, submenuIndex],
  );

  return (
    <Menu.SubMenu
      {...props}
      popupOffset={[0, submenuYOffset]}
      popupClassName="chart-context-submenu"
      title={title}
    >
      <div data-test="hierarchy-submenu">
        {subMenuItems.map((item, i) => (
          <MenuItemWithTruncation
            {...props}
            tooltipText={`${title}`}
            key={`hierarchy-${i}`}
            onClick={console.log}
          >
            {item}
          </MenuItemWithTruncation>
        ))}
      </div>
    </Menu.SubMenu>
  );
};
