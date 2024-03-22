import React, { useCallback, useState } from 'react';
import { ControlComponentProps } from '@superset-ui/chart-controls';
import { DrillDownValue, t, useTheme } from '@superset-ui/core';
import Icons from 'src/components/Icons';
import ControlHeader from '../../ControlHeader';
import ControlPopover from '../ControlPopover/ControlPopover';
import {
  AddControlLabel,
  DndLabelsContainer,
  HeaderContainer,
} from '../OptionControls';
import { Datasource, DrillDownPopoverContent } from './DrillDownPopoverContent';
import { DrillDownItem } from './DrillDownItem';

type DrilldownControlProps = Omit<ControlComponentProps, 'value'> & {
  value?: DrillDownValue[];
  datasource: Datasource;
};

const DrilldownControl = ({
  value = [],
  onChange,
  ...props
}: DrilldownControlProps) => {
  const theme = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const togglePopover = useCallback((value, visible: boolean) => {
    setSelectedIndex(visible ? value.length : null);
  }, []);

  const handleSave = (item: DrillDownValue, index?: number) => {
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
          <DrillDownItem
            key={i}
            index={i}
            onDelete={handleDelete}
            onClick={setSelectedIndex}
          >
            {label} ({t(type)})
          </DrillDownItem>
        ))}

        <AddControlLabel onClick={() => setSelectedIndex(value.length)}>
          <Icons.PlusSmall iconColor={theme.colors.grayscale.light1} />
          {t('Add Drilldown URL')}
        </AddControlLabel>

        <ControlPopover
          trigger="click"
          content={
            <DrillDownPopoverContent
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

export default DrilldownControl;
