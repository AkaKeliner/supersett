import React, { useCallback, useState } from 'react';
import { ControlComponentProps } from '@superset-ui/chart-controls';
import { URLDrillDownValueType, t, useTheme } from '@superset-ui/core';
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
} from './URLDrillDownPopoverContent';
import { URLDrillDownItem } from './URLDrillDownItem';

type URLDrilldownControlProps = Omit<ControlComponentProps, 'value'> & {
  value?: URLDrillDownValueType[];
  datasource: Datasource;
};

const URLDrilldownControl = ({
  value = [],
  onChange,
  ...props
}: URLDrilldownControlProps) => {
  const theme = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const togglePopover = useCallback((value, visible: boolean) => {
    setSelectedIndex(visible ? value.length : null);
  }, []);

  const handleSave = (item: URLDrillDownValueType, index?: number) => {
    const nextValue = [...value];
    if (index !== undefined) nextValue[index] = item;
    else nextValue.push(item);
    onChange?.(nextValue);
  };

  const handleDelete = (index: number) => {
    const nextValue = [...(value || [])];
    nextValue.splice(index, 1);
    onChange?.(nextValue);
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
            onClick={setSelectedIndex}
          >
            {label} ({t(type)})
          </URLDrillDownItem>
        ))}

        <AddControlLabel onClick={() => setSelectedIndex(value.length)}>
          <Icons.PlusSmall iconColor={theme.colors.grayscale.light1} />
          {t('Add Drilldown URL')}
        </AddControlLabel>

        <ControlPopover
          trigger="click"
          content={
            <URLDrillDownPopoverContent
              index={selectedIndex === null ? value.length : selectedIndex}
              onClose={setSelectedIndex}
              onSave={handleSave}
              drilldown={value[selectedIndex!]}
              datasource={props.datasource}
            />
          }
          defaultVisible={false}
          visible={selectedIndex !== null}
          onVisibleChange={togglePopover.bind(null, value)}
          destroyTooltipOnHide
        />
      </DndLabelsContainer>
    </div>
  );
};

export default URLDrilldownControl;
