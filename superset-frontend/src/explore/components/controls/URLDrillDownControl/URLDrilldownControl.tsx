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
  Datasource,
  URLDrillDownPopoverContent,
  URLDrillDownValueType,
} from './URLDrillDownPopoverContent';
import { URLDrillDownItem } from './URLDrillDownItem';

type URLDrilldownControlProps = Omit<ControlComponentProps, 'value'> & {
  value?: URLDrillDownValueType[];
  datasource: Datasource;
};

const URLDrilldownControl = ({
  value,
  onChange,
  ...props
}: URLDrilldownControlProps) => {
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

  const handleDelete = (index: number) => {
    const nextValue = [...(value || [])];
    nextValue.splice(index, 1);
    onChange?.(nextValue);
  };

  const handleEdit = (idnex: number) => {
    setSelectedItem(value?.[idnex]);
  };

  return (
    <div>
      <HeaderContainer>
        <ControlHeader {...props} />
      </HeaderContainer>

      <DndLabelsContainer>
        {value?.map(({ label, type }, i) => (
          <URLDrillDownItem
            key={i}
            index={i}
            onDelete={handleDelete}
            onClick={handleEdit}
          >
            {label} ({t(type)})
          </URLDrillDownItem>
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
              datasource={props.datasource}
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
