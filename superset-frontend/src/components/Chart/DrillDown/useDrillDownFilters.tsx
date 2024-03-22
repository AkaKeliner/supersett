import {
  ContextMenuFilters,
  QueryObjectFilterClause,
  isSetAdhocFilter,
  isSimpleAdhocFilter,
} from '@superset-ui/core';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'src/dashboard/types';
import { Operators } from 'src/explore/constants';

type SelectorResult = {
  nativeFilters: RootState['nativeFilters'];
  charts: RootState['charts'];
};

export const useDrillDownFilters = (
  sliceId: number,
  restrictions: ContextMenuFilters['drillDown'] = {},
) => {
  const { nativeFilters, charts } = useSelector<RootState, SelectorResult>(
    ({ nativeFilters, charts }) => ({ nativeFilters, charts }),
  );

  return useMemo(() => {
    const filters: QueryObjectFilterClause[] = [];

    Object.values(nativeFilters.filters).forEach(
      ({ defaultDataMask, chartsInScope }) => {
        if (chartsInScope?.includes(sliceId)) {
          filters.push(...(defaultDataMask?.extraFormData?.filters || []));
        }
      },
    );

    charts[sliceId].latestQueryFormData.adhoc_filters?.forEach(item => {
      if (isSimpleAdhocFilter(item) && isSetAdhocFilter(item)) {
        const { comparator, subject, operator } = item;

        if (Array.isArray(comparator) && subject && operator) {
          filters.push({ val: comparator, col: subject, op: operator });
        }
      }
    });

    Object.entries(restrictions).forEach(([col, val]) => {
      if (val !== null && !(val instanceof Date)) {
        filters.push({ col, val: [val], op: Operators.IN });
      }
    });

    return filters;
  }, [nativeFilters, charts, sliceId, restrictions]);
};
