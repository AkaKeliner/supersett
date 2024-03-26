import React from 'react';
import { styled, t } from '@superset-ui/core';
import TextControl from 'src/explore/components/controls/TextControl';
import { SelectOptionsType } from 'src/components/Select/types';
import Button from 'src/components/Button';
import { Select, Row, Col } from 'src/components';
import { SelectValue } from 'antd/lib/select';

const Container = styled.div`
  & > * {
    margin-bottom: 10px;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 20px;
`;

export type ColumnHierarchyItem = { value: number; id: number };

export type ColumnsHierarchy = {
  name: string;
  created: string;
  updated?: string | null;
  columns: ColumnHierarchyItem[];
};

type Props = {
  value?: ColumnHierarchyItem[];
  onChange?: (value: ColumnHierarchyItem[]) => void;
  options: SelectOptionsType;
};

export const HierarchyControl = ({
  value: columns = [],
  options,
  onChange,
}: Props) => {
  const handleColumnChange = (index: number, value: SelectValue) => {
    const next = [...columns];
    next[index].id = value as number;
    onChange?.(next);
  };

  const handleValueChange = (index: number, v: string) => {
    const value = parseInt(v, 10);
    if (Number.isNaN(value)) return;
    const next = [...columns];
    next[index].value = value as number;
    onChange?.(next);
  };

  return (
    <Container>
      {columns.map(({ value, id }, i) => (
        <Row gutter={16} key={id}>
          <Col xs={18}>
            <Select
              ariaLabel={t('Column')}
              options={options}
              name="column"
              allowNewOptions
              allowClear
              onChange={handleColumnChange.bind(null, i)}
              value={id}
            />
          </Col>

          <Col xs={6}>
            <TextControl
              controlId="order"
              placeholder={t('Order')}
              onChange={handleValueChange.bind(null, i)}
              value={value}
            />
          </Col>
        </Row>
      ))}

      <ButtonWrapper>
        <Button
          buttonSize="small"
          buttonStyle="tertiary"
          onClick={() => onChange?.([...columns, {} as ColumnHierarchyItem])}
        >
          <i className="fa fa-plus" />
          {t('Add')}
        </Button>
      </ButtonWrapper>
    </Container>
  );
};
