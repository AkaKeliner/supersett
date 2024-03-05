import React, { useCallback, useState } from 'react';
import { ControlComponentProps } from '@superset-ui/chart-controls';
import { t, useTheme } from '@superset-ui/core';
import Icons from 'src/components/Icons';
import ControlHeader from '../../ControlHeader';
import ControlPopover from '../ControlPopover/ControlPopover';
import {
  AddControlLabel,
  DndLabelsContainer,
  HeaderContainer,
} from '../OptionControls';
import {
  URLDrillDownPopoverContent,
  URLDrillDownValueType,
} from './URLDrillDownPopoverContent';
import { URLDrillDownItem } from './URLDrillDownItem';

type URLDrilldownControlProps = Omit<ControlComponentProps, 'value'> & {
  value?: URLDrillDownValueType[];
};

const URLDrilldownControl = ({
  value,
  onChange,
  ...props
}: URLDrilldownControlProps) => {
  console.log(props);
  const theme = useTheme();
  const [selectedItem, setSelectedItem] =
    useState<Partial<URLDrillDownValueType>>();

  const togglePopover = useCallback((visible: boolean) => {
    setSelectedItem(visible ? {} : undefined);
  }, []);

  const handleSave = (item: URLDrillDownValueType, index?: number) => {
    const nextValue = [...(value || [])];
    if (index) nextValue[index] = item;
    else nextValue.push(item);
    onChange?.(nextValue);
  };

  return (
    <div>
      <HeaderContainer>
        <ControlHeader {...props} />
      </HeaderContainer>

      <DndLabelsContainer>
        {value?.map(({ label }) => (
          <URLDrillDownItem>{label}</URLDrillDownItem>
        ))}

        <AddControlLabel onClick={() => setSelectedItem({})}>
          <Icons.PlusSmall iconColor={theme.colors.grayscale.light1} />
          {t('Add Drilldown URL')}
        </AddControlLabel>

        <ControlPopover
          trigger="click"
          content={
            <URLDrillDownPopoverContent
              onClose={() => setSelectedItem(undefined)}
              onSave={handleSave}
              drilldown={selectedItem || {}}
            />
          }
          defaultVisible={false}
          visible={!!selectedItem}
          onVisibleChange={togglePopover}
          destroyTooltipOnHide
        />
      </DndLabelsContainer>
    </div>
  );
};

export default URLDrilldownControl;
