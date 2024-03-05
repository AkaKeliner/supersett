/*
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

import prettyMsFormatter from 'pretty-ms';
import NumberFormatter from '../NumberFormatter';

export const localeReplacer = (text: string) =>
  text &&
  text
    .replace('ns', 'нс.')
    .replace('µs', 'мкс.')
    .replace('ms', 'мс.')
    .replace('s', 'с.')
    .replace('m', 'мин.')
    .replace('h', 'ч.')
    .replace('d', 'дн.');
export default function createDurationFormatter(
  config: {
    description?: string;
    id?: string;
    label?: string;
    multiplier?: number;
  } & prettyMsFormatter.Options = {},
) {
  const { description, id, label, multiplier = 1, ...prettyMsOptions } = config;

  const customFormatter = (value: number) => {
    const formatValue = prettyMsFormatter(value * multiplier, prettyMsOptions);
    return localeReplacer(formatValue);
  };

  return new NumberFormatter({
    description,
    // formatFunc: value => prettyMsFormatter(value * multiplier, prettyMsOptions),
    formatFunc: customFormatter,
    id: id ?? 'duration_format',
    label: label ? localeReplacer(label) : `Duration formatter`,
  });
}
