import { ColumnsHierarchy, QueryFormData } from '@superset-ui/core';
import { useMemo } from 'react';

export type HierarchyConfig = {
  columnKey: string;
  hierarchy: ColumnsHierarchy;
  formData: QueryFormData;
};

export const useHierarchy = ({
  columnKey,
  hierarchy,
  formData,
}: HierarchyConfig) => {
  const columns = useMemo(
    () => hierarchy.columns.sort((a, b) => (a.value > b.value ? 1 : -1)),
    [hierarchy.columns],
  );

  return columns
    ?.slice(columns?.findIndex(({ name }) => name === columnKey) + 1)
    .map(item => ({
      ...item,
      active: formData.groupby?.includes(item.name),
    }));
};
