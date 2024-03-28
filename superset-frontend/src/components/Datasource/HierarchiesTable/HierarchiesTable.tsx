import React, { useMemo } from 'react';
import { ColumnsHierarchy, Datasource, styled, t } from '@superset-ui/core';
import EditableTitle from 'src/components/EditableTitle';
import Card from 'src/components/Card';
import CollectionTable from '../CollectionTable';
import { HierarchyControl } from './HierarchyControl';
import Fieldset from '../Fieldset';
import Field from '../Field';

const StyledLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  span {
    margin-right: ${({ theme }) => theme.gridUnit}px;
  }
`;

type Props = {
  datasource: Datasource;
  onChange?: (value: ColumnsHierarchy[]) => void;
};

export const HierarchiesTable = ({ datasource, onChange }: Props) => {
  const { hierarchies = [] } = datasource;

  const options = useMemo(
    () =>
      (datasource.columns || []).map(col => ({
        label: col.verbose_name || col.column_name,
        value: col.column_name,
      })),
    [datasource.columns],
  );

  return (
    <CollectionTable
      onChange={onChange}
      tableColumns={['name', 'created', 'updated']}
      sortColumns={[]}
      collection={hierarchies}
      allowDeletes
      allowAddItem
      stickyHeader
      columnLabels={{
        name: t('Название'),
        created: t('Создано'),
        updated: t('Когда изменено'),
      }}
      expandFieldset={
        <Card padded>
          <Fieldset compact>
            <Field
              fieldKey="columns"
              label={t('Редактирование иерархии')}
              control={<HierarchyControl options={options} />}
            />
          </Fieldset>
        </Card>
      }
      itemRenderers={{
        name: (v: string, onItemChange) => (
          <StyledLabelWrapper>
            <EditableTitle canEdit title={v} onSaveTitle={onItemChange} />
          </StyledLabelWrapper>
        ),
      }}
      itemGenerator={() => ({
        name: `Новая иерархия ${hierarchies.length}`,
        created: new Date().toISOString(),
        columns: [],
      })}
    />
  );
};
