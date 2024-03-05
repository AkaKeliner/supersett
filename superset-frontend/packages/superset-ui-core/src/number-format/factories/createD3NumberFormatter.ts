/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  format as d3_format,
  formatSpecifier,
  formatLocale,
  FormatLocaleDefinition,
} from 'd3-format';
import { isRequired } from '../../utils';
import NumberFormatter from '../NumberFormatter';
import { NumberFormatFunction } from '../types';

export const defaultFormat = '.0f';
const d3SiPrefixMap = {
  y: 'e-24',
  z: 'e-21',
  a: 'e-18',
  f: 'e-15',
  p: 'e-12',
  n: 'e-9',
  µ: 'e-6',
  m: 'e-3',
  '': '',
  k: ' тыс.',
  M: ' млн.',
  G: ' млрд.',
  T: ' трлн.',
  P: ' квадрлн.',
  E: ' квнтлн.',
  Z: ' скстлн.',
  Y: ' сптлн.',
};
export const d3Format = ({
  specifier,
  locale,
}: {
  specifier: string | number;
  locale: any;
}) => {
  const loc = locale && formatLocale({ ...locale });
  const formattedSpecifier = formatSpecifier(
    <string>specifier || defaultFormat,
  );
  const valueFormatter = loc?.format(<string>specifier || defaultFormat);

  return (value: string | number) => {
    // @ts-ignore
    const result = valueFormatter(value || 0);
    if (formattedSpecifier.type === 's') {
      // modify the return value when using si-prefix.
      const lastChar = result[result.length - 1];
      if (Object.keys(d3SiPrefixMap).includes(lastChar)) {
        return result.slice(0, -1) + d3SiPrefixMap[lastChar];
      }
    }
    return result;
  };
};
export default function createD3NumberFormatter(config: {
  description?: string;
  formatString: string;
  label?: string;
  locale?: FormatLocaleDefinition;
}) {
  const {
    description,
    formatString = isRequired('config.formatString'),
    label,
    locale,
  } = config;

  let formatFunc: NumberFormatFunction;
  let isInvalid = false;
  try {
    formatFunc =
      typeof locale === 'undefined'
        ? d3_format(formatString)
        : d3Format({ specifier: formatString, locale });
  } catch (error) {
    formatFunc = value => `${value} (Invalid format: ${formatString})`;
    isInvalid = true;
  }

  return new NumberFormatter({
    description,
    formatFunc,
    id: formatString,
    isInvalid,
    label,
  });
}
