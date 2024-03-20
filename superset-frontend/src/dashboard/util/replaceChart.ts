import { DashboardLayout } from '../types';
import getLayoutComponentFromChartId from './getLayoutComponentFromChartId';
import entityFactory from './newComponentFactory';

export function replaceChart(
  prevLayout: DashboardLayout,
  prevSliceId: number,
  nextSliceId: number,
  nextSliceName: string,
) {
  const prevChartHolder = getLayoutComponentFromChartId(
    prevLayout,
    prevSliceId,
  );

  const [parentId] = prevChartHolder.parents.slice(-1);

  const chartLayoutMeta = {
    ...prevChartHolder.meta,
    chartId: nextSliceId,
    sliceName: nextSliceName,
  };

  const nextChartHolder = entityFactory(
    prevChartHolder.type,
    chartLayoutMeta,
    prevChartHolder.parents,
  );

  const nextLayout = {
    ...prevLayout,
    [parentId]: {
      ...prevLayout[parentId],
      children: prevLayout[parentId].children.map(childId =>
        childId === prevChartHolder.id ? nextChartHolder.id : childId,
      ),
    },
    [nextChartHolder.id]: nextChartHolder,
  };

  delete nextLayout[prevChartHolder.id];

  return nextLayout;
}
