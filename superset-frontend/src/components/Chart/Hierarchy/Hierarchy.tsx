import React, { useCallback, useMemo } from 'react';
import { Menu } from 'src/components/Menu';
import { CheckboxChecked, CheckboxUnchecked } from 'src/components/Checkbox';
import { styled } from '@superset-ui/core';
import { useDispatch } from 'react-redux';
import { MenuItemWithTruncation } from '../MenuItemWithTruncation';
import { getSubmenuYOffset } from '../utils';
import { HierarchyConfig, useHierarchy } from './useHierarchy';
import { setGroupbyFromHierarchy } from '../chartAction';

const MenuItem = styled.div`
  display: flex;
  align-items: center;

  & > *:first-child {
    margin-right: 10px;
  }
`;

type Props = HierarchyConfig & {
  title: string;
  contextMenuY?: number;
  submenuIndex?: number;
  onSelection?: () => void;
  onClick?: (event: MouseEvent) => void;
};

export const Hierarchy = ({
  title,
  formData,
  hierarchy,
  columnKey,
  contextMenuY = 0,
  submenuIndex = 0,
  onSelection = () => null,
  onClick = () => null,
  ...props
}: Props) => {
  const dispatch = useDispatch();

  const subMenuItems = useHierarchy({ columnKey, hierarchy, formData });

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

  const handleSelect = useCallback(
    ({ name, active }, e) => {
      onClick(e);
      onSelection();
      if (active) {
        dispatch(setGroupbyFromHierarchy(formData.slice_id, name));
      } else {
        dispatch(setGroupbyFromHierarchy(formData.slice_id, columnKey, name));
      }
    },
    [dispatch, onSelection, onClick, formData.slice_id, columnKey],
  );

  if (!subMenuItems.length) return null;

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
            onClick={handleSelect.bind(null, item)}
          >
            <MenuItem>
              {item.active ? <CheckboxChecked /> : <CheckboxUnchecked />}
              {item.name}
            </MenuItem>
          </MenuItemWithTruncation>
        ))}
      </div>
    </Menu.SubMenu>
  );
};
