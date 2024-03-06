import React, { useMemo, useState } from 'react';
import { SupersetTheme, styled, t } from '@superset-ui/core';
import { Row, Select } from 'src/components';
import Button from 'src/components/Button';
import { Input } from 'src/components/Input';
import { SelectValue } from 'antd/lib/select';
import { Slice } from 'src/types/Chart';
import { DatasetObject } from 'src/features/datasets/types';
import { ExplorePopoverContent } from '../../ExploreContentPopover';

const URLDrillDownPopoverContentContainer = styled.div`
  .adhoc-filter-edit-tabs > .nav-tabs {
    margin-bottom: ${({ theme }) => theme.gridUnit * 2}px;

    & > li > a {
      padding: ${({ theme }) => theme.gridUnit}px;
    }
  }

  #filter-edit-popover {
    max-width: none;
  }

  .filter-edit-clause-info {
    font-size: ${({ theme }) => theme.typography.sizes.xs}px;
    padding-left: ${({ theme }) => theme.gridUnit}px;
  }

  .filter-edit-clause-section {
    display: inline-flex;
  }

  .adhoc-filter-simple-column-dropdown {
    margin-top: ${({ theme }) => theme.gridUnit * 5}px;
  }
`;

const URLDrillDownActionsContainer = styled.div`
  margin-top: ${({ theme }) => theme.gridUnit * 2}px;
`;

enum URLDrillDownType {
  dashboards = 'Dashboard',
  chart = 'Chart',
}

const targetType = [
  { value: URLDrillDownType.dashboards, label: t('Dashboard') },
  { value: URLDrillDownType.chart, label: t('Chart') },
];

type Dashbord = {
  id: number;
  dashboard_title: string;
};

export type Datasource = {
  dashboards: Dashbord[];
  slices: Slice[];
  metrics: DatasetObject['metrics'];
};

export type URLDrillDownValueType = {
  label: string;
  field: string;
  type: string;
  url: string;
};

type Props = {
  onClose: () => void;
  onSave?: (item: URLDrillDownValueType, index?: number) => void;
  drilldown: Partial<URLDrillDownValueType>;
  index?: number;
  datasource: Datasource;
};

export const URLDrillDownPopoverContent = ({
  onClose,
  onSave,
  drilldown,
  index,
  datasource,
}: Props) => {
  const [state, setState] = useState({ ...drilldown });

  const hasError = !(state.field && state.label && state.type && state.url);

  const metrics = useMemo(
    () =>
      datasource.metrics.map(({ id, metric_name }) => ({
        value: id,
        label: metric_name,
      })),
    [datasource.metrics],
  );

  const dashboards = useMemo(
    () =>
      datasource.dashboards.map(({ id, dashboard_title }) => ({
        value: id,
        label: dashboard_title,
      })),
    [datasource.dashboards],
  );

  const charts = useMemo(
    () =>
      datasource.slices.map(({ slice_id, slice_name }) => ({
        value: slice_id,
        label: slice_name,
      })),
    [datasource.slices],
  );

  const urlOptions =
    state.type === URLDrillDownType.dashboards ? dashboards : charts;

  const handleSave = () => {
    onSave?.(state as URLDrillDownValueType, index);
    onClose();
  };

  const handleChange = (
    field: keyof URLDrillDownValueType,
    value: string | SelectValue,
  ) => {
    setState({ ...state, [field]: value });
  };

  return (
    <ExplorePopoverContent>
      <URLDrillDownPopoverContentContainer
        id="url-drill-down-edit-popover"
        data-test="url-drill-down-edit-popover"
      >
        <div>
          <Row>
            <Input
              placeholder={t('Title')}
              value={state.label || ''}
              onChange={e => handleChange('label', e.currentTarget.value)}
            />
          </Row>

          <Row>
            <Select
              placeholder={t('Metric')}
              options={metrics}
              css={(theme: SupersetTheme) => ({
                marginTop: theme.gridUnit * 4,
              })}
              value={state.field}
              onChange={value => handleChange('field', value)}
            />
          </Row>

          <Row>
            <Select
              placeholder={t('Type')}
              options={targetType}
              css={(theme: SupersetTheme) => ({
                marginTop: theme.gridUnit * 4,
              })}
              value={state.type}
              onChange={value => handleChange('type', value)}
            />
          </Row>

          <Row>
            <Select
              placeholder={t('Object')}
              options={urlOptions}
              css={(theme: SupersetTheme) => ({
                marginTop: theme.gridUnit * 4,
                marginBottom: theme.gridUnit * 4,
              })}
              disabled={!state.type}
              value={state.url}
              onChange={value => handleChange('url', value)}
            />
          </Row>
        </div>

        <URLDrillDownActionsContainer>
          <Button buttonSize="small" onClick={onClose} cta>
            {t('Close')}
          </Button>

          <Button
            data-test="url-drill-down-edit-popover-save-button"
            disabled={hasError}
            buttonStyle="primary"
            buttonSize="small"
            className="m-r-5"
            onClick={handleSave}
            cta
          >
            {t('Save')}
          </Button>
        </URLDrillDownActionsContainer>
      </URLDrillDownPopoverContentContainer>
    </ExplorePopoverContent>
  );
};
