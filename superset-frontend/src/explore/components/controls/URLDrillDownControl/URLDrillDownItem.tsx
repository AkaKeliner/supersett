import React, { PropsWithChildren, useState } from 'react';
import Icons from 'src/components/Icons';
import { styled, useTheme } from '@superset-ui/core';
import ControlPopover from '../ControlPopover/ControlPopover';
import {
  CloseContainer,
  Label,
  OptionControlContainer,
} from '../OptionControls';

const ItemLabel = styled.div`
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type Props = PropsWithChildren<{
  onDelete?: () => void;
  onClick?: () => void;
}>;

export const URLDrillDownItem = ({ children, onDelete, onClick }: Props) => {
  const theme = useTheme();

  return (
    <OptionControlContainer data-test="option-label" onClick={onClick}>
      <CloseContainer
        role="button"
        data-test="remove-control-button"
        onClick={onDelete}
      >
        <Icons.XSmall iconColor={theme.colors.grayscale.light1} />
      </CloseContainer>

      <Label data-test="control-label">
        <ItemLabel>{children}</ItemLabel>
      </Label>
    </OptionControlContainer>
  );
};
