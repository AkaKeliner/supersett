import React from 'react';
import PropTypes from 'prop-types';

import { t } from '@superset-ui/core';
import { Col, Row, Select } from 'antd';
import Button from '../../../components/Button';

const propTypes = {
  ariaLabel: PropTypes.string,
  autoFocus: PropTypes.bool,
  choices: PropTypes.array,
  clearable: PropTypes.bool,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  disabled: PropTypes.bool,
  freeForm: PropTypes.bool,
  isLoading: PropTypes.bool,
  mode: PropTypes.string,
  multi: PropTypes.bool,
  isMulti: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onSelect: PropTypes.func,
  onDeselect: PropTypes.func,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array,
  ]),
  default: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array,
  ]),
  showHeader: PropTypes.bool,
  optionRenderer: PropTypes.func,
  valueKey: PropTypes.string,
  options: PropTypes.array,
  placeholder: PropTypes.string,
  filterOption: PropTypes.func,
  tokenSeparators: PropTypes.arrayOf(PropTypes.string),
  notFoundContent: PropTypes.object,

  // ControlHeader props
  label: PropTypes.string,
  renderTrigger: PropTypes.bool,
  validationErrors: PropTypes.array,
  rightNode: PropTypes.node,
  leftNode: PropTypes.node,
  onClick: PropTypes.func,
  hovered: PropTypes.bool,
  tooltipOnClick: PropTypes.func,
  warning: PropTypes.string,
  danger: PropTypes.string,
};

const defaultProps = {
  autoFocus: false,
  choices: [],
  clearable: true,
  description: null,
  disabled: false,
  freeForm: false,
  isLoading: false,
  label: null,
  multi: false,
  onChange: () => {},
  onFocus: () => {},
  showHeader: true,
  valueKey: 'value',
};
const targetType = [
  { value: 'dashboards', label: t('Dashboard') },
  { value: 'slices', label: t('Slice') },
];

export default class URLDrilldownControl extends React.Component {
  constructor(props) {
    console.log('PROPS', props);

    super(props);
    // eslint-disable-next-line react/no-unused-state
    this.state = { hovered: false, availableObjects: {} };
  }

  componentDidMount() {
    // this.getDataSourceData(this.props.datasource.edit_url);
    // const state = this.props.mapStateToProps();
    // const charts = this.props.actions.getSliceDashboards();
    // console.log('charts ===> ', charts);
    // const DatasourceSamples = this.props.actions.getDatasourceSamples();
    // console.log('DatasourceSamples ===> ', DatasourceSamples);
  }

  // TODO возможно нужно сделать запрос на панели и отчеты
  // getDataSourceData = async url => {
  //   console.log('window.location', window.location);
  //   const response = await fetch(`${window.location.origin}${url}`);
  //   const res = response.json();
  //   console.log('RES ===> ', res);
  // };

  onChangeType = (index, type) => {
    if (type && this.props.value[index].type !== type) {
      this.props.value[index].url = null;
      this.setState({
        // eslint-disable-next-line react/no-unused-state
        availableObjects: this.props[type].map(o => ({
          label: type === 'slices' ? o.slice_name : o.dashboard_title,
          value: type === 'slices' ? o.slice_id : o.id,
        })),
      });
    }

    this.changeDrilldown(index, 'type', type);
  };

  onChangeCheckBox(i, val) {
    this.changeDrilldown(i, 'drilldownToInfoPanel', val);
  }

  addDrilldown() {
    const newFields = Object.assign([], this.props.value);
    newFields.push({
      title: '',
      field: '',
      type: '',
      url: '',
      drilldownToInfoPanel: false,
    });
    this.props.onChange(newFields);
  }

  changeDrilldown(index, control, value) {
    const newFields = Object.assign([], this.props.value);
    const modifiedDrilldown = { ...newFields[index] };

    if (typeof control === 'string') {
      if (control === 'type') {
        modifiedDrilldown.drilldownToInfoPanel = value === 'dashboards';
      }
      if (typeof value === 'object') {
        modifiedDrilldown[control] = value ? value.value : null;
      } else {
        modifiedDrilldown[control] = value;
      }
    } else {
      control.forEach((c, i) => {
        modifiedDrilldown[c] = value[i];
      });
    }
    newFields.splice(index, 1, modifiedDrilldown);
    console.log('newFields', newFields);
    this.props.onChange(newFields);
  }

  removeDrilldown(index) {
    this.props.onChange(this.props.value.filter((f, i) => i !== index));
  }

  getMetrics() {
    const { metrics = [] } = this.props.latestQueryFormData || {};
    const mappedMetrics = metrics.map(m => ({
      label: typeof m === 'string' ? m : m.label,
      value: typeof m === 'string' ? m : m.label,
    }));
    return mappedMetrics;
  }

  setHover(hovered) {
    this.setState({ hovered });
  }

  render() {
    const val =
      this.props.value && Array.isArray(this.props.value)
        ? this.props.value
        : [];
    const drilldowns = val.map((drilldown, i) => (
      <div key={i}>
        <Row>
          <input
            style={{ width: '271px' }}
            placeholder={t('Title')}
            className="form-control"
            type="text"
            value={drilldown.title}
            onChange={el => this.changeDrilldown(i, 'title', el.target.value)}
          />
        </Row>
        <Row>
          <Select
            style={{ width: '271px' }}
            placeholder={t('Metric')}
            options={this.getMetrics()}
            value={drilldown.field}
            onChange={val => this.changeDrilldown(i, 'field', val)}
          />
        </Row>
        <Row>
          <Select
            style={{ width: '271px' }}
            placeholder={t('Type')}
            options={targetType}
            value={drilldown.type}
            onChange={val => {
              this.onChangeType(i, val);
            }}
          />
        </Row>
        <Row>
          <Select
            style={{ width: '271px' }}
            placeholder={t('Object')}
            options={
              drilldown.drilldownToInfoPanel
                ? this.props.dashboards
                  ? this.props.dashboards.map(o => ({
                      label: o.dashboard_title,
                      value: o.id,
                    }))
                  : []
                : this.props[drilldown.type]
                ? this.props[drilldown.type].map(o => ({
                    label: o.slice_name,
                    value: o.slice_id,
                  }))
                : []
            }
            value={drilldown.url}
            onChange={val => this.changeDrilldown(i, 'url', val)}
          />
        </Row>

        <Row className="space-2">
          <Button
            id="remove-button"
            bsSize="small"
            onClick={this.removeDrilldown.bind(this, i)}
          >
            <i className="fa fa-minus" />
          </Button>
        </Row>
      </div>
    ));
    console.log('PROPS', this.props);
    console.log('STATE', this.state);
    return (
      <div>
        <Row>
          <label className="control-label">
            <span>{t('URL Drilldown')}</span>
          </label>
        </Row>
        <Row>{drilldowns}</Row>
        <Row className="space-2">
          <Col md={2}>
            <Button
              id="add-button"
              bsSize="sm"
              onClick={this.addDrilldown.bind(this)}
            >
              <i className="fa fa-plus" /> &nbsp; {t('Add Drilldown URL')}
            </Button>
          </Col>
        </Row>
      </div>
    );
  }
}

URLDrilldownControl.propTypes = propTypes;
URLDrilldownControl.defaultProps = defaultProps;
