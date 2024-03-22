import React, { PropsWithChildren } from 'react';
import Icons from 'src/components/Icons';
import { styled, useTheme } from '@superset-ui/core';
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

const Container = styled(OptionControlContainer)`
  margin-bottom: 4px;
  cursor: pointer;
`;

type Props = PropsWithChildren<{
  onDelete?: (index: number) => void;
  onClick?: (index: number) => void;
  index: number;
}>;

export const DrillDownItem = ({
  children,
  index,
  onDelete,
  onClick,
}: Props) => {
  const theme = useTheme();

  return (
    <Container data-test="option-label" onClick={() => onClick?.(index)}>
      <CloseContainer
        role="button"
        data-test="remove-control-button"
        onClick={e => {
          e.stopPropagation();
          onDelete?.(index);
        }}
      >
        <Icons.XSmall iconColor={theme.colors.grayscale.light1} />
      </CloseContainer>

      <Label data-test="control-label">
        <ItemLabel>{children}</ItemLabel>
      </Label>
    </Container>
  );
};
