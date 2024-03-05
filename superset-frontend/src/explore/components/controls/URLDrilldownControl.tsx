import { ControlComponentProps } from '@superset-ui/chart-controls';

import { t } from '@superset-ui/core';
import { Col, Row, Select } from 'src/components';
import Button from 'src/components/Button';
import React from 'react';

const targetType = [
  { value: 'dashboards', label: t('Dashboard') },
  { value: 'slices', label: t('Slice') },
];

type ValueType = {};

type URLDrilldownControlProps = ControlComponentProps & {};

const URLDrilldownControl = ({
  value,
  name,
  onChange,
}: URLDrilldownControlProps) => {
  const val = value && Array.isArray(value) ? value : [];

  const drilldowns = val.map((drilldown, i) => (
    <div key={i}>
      <Row>
        <input
          style={{ width: '271px' }}
          placeholder={t('Title')}
          className="form-control"
          type="text"
          value={drilldown.title}
        />
      </Row>

      <Row>
        <Select
          placeholder={t('Metric')}
          options={[]}
          value={drilldown.field}
        />
      </Row>

      <Row>
        <Select
          placeholder={t('Type')}
          options={targetType}
          value={drilldown.type}
        />
      </Row>

      <Row>
        <Select placeholder={t('Object')} options={[]} value={drilldown.url} />
      </Row>

      <Row className="space-2">
        <Button id="remove-button">
          <i className="fa fa-minus" />
        </Button>
      </Row>
    </div>
  ));

  return (
    <div>
      <Row>
        <span className="control-label">{t('URL Drilldown')}</span>
      </Row>
      <Row>{drilldowns}</Row>
      <Row className="space-2">
        <Col md={2}>
          <Button id="add-button">
            <i className="fa fa-plus" /> &nbsp; {t('Add Drilldown URL')}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default URLDrilldownControl;
