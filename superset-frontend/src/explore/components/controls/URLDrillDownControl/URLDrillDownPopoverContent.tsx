import React, { useState } from 'react';
import { SupersetTheme, styled, t } from '@superset-ui/core';
import { Row, Select } from 'src/components';
import Button from 'src/components/Button';
import { Input } from 'src/components/Input';
import { SelectValue } from 'antd/lib/select';
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

const targetType = [
  { value: 'dashboards', label: t('Dashboard') },
  { value: 'slices', label: t('Slice') },
];

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
};

export const URLDrillDownPopoverContent = ({
  onClose,
  onSave,
  drilldown,
  index,
}: Props) => {
  const [state, setState] = useState({ ...drilldown });
  const [errors, setErrors] = useState<
    Partial<Record<keyof URLDrillDownValueType, boolean>>
  >({});

  const handleSave = () => {
    if (state.field && state.label && state.type && state.url) {
      onSave?.(state as URLDrillDownValueType, index);
    }
  };

  const handleChange = (
    field: keyof URLDrillDownValueType,
    value: string | SelectValue,
  ) => {
    if (errors[field]) setErrors({ ...errors, [field]: false });
    if (!value) setErrors({ ...errors, [field]: true });
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
              options={[]}
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
              options={[]}
              css={(theme: SupersetTheme) => ({
                marginTop: theme.gridUnit * 4,
                marginBottom: theme.gridUnit * 4,
              })}
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
            disabled={false}
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
