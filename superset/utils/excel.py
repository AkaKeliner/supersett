# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
import io
from typing import Any
import pandas as pd
from openpyxl import Workbook
from openpyxl.utils.dataframe import dataframe_to_rows
from openpyxl.styles import Alignment, Side, Border


def df_to_excel(df: pd.DataFrame, additional_data=None, **kwargs: Any) -> Any:

    # timezones are not supported
    for column in df.select_dtypes(include=["datetimetz"]).columns:
        df[column] = df[column].astype(str)

    # pylint: disable=abstract-class-instantiated
    # with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
    #     df.to_excel(writer, **kwargs)
    try:
        output = add_width_normalization(df, additional_data, **kwargs)
    except Exception as e:
        print(f"catch error in df_to_excel:\n {e.args}")
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
            df.to_excel(writer, **kwargs)
    return output.getvalue()


def add_width_normalization(
    df: pd.DataFrame, additional_data=None, **kwargs: Any
) -> Any:
    output = io.BytesIO()

    # Записываем DataFrame в файл Excel с помощью openpyxl
    # with pd.ExcelWriter(output, engine="openpyxl") as writer:
    #     df.to_excel(writer, index=False, **kwargs)
    #
    #     # Получаем объект workbook и worksheet
    #     workbook = writer.book
    #     worksheet = writer.sheets["Sheet1"]
    #
    #     # Устанавливаем максимальную ширину столбцов
    #     for col in worksheet.columns:
    #         max_length = 0
    #         column = col[0].column_letter
    #         for cell in col:
    #             try:
    #                 if len(str(cell.value)) > max_length:
    #                     max_length = len(cell.value)
    #             except:
    #                 pass
    #         adjusted_width = (
    #             max_length + 2
    #         ) * 1.2  # 1.2 - коэффициент масштабирования для учета ширины символов
    #         worksheet.column_dimensions[column].width = min(350, adjusted_width)
    # Создаем объект Workbook
    workbook = Workbook()

    # Создаем объект Worksheet
    worksheet = workbook.active

    # Записываем данные DataFrame в Excel файл с использованием openpyxl
    for row in dataframe_to_rows(df, index=False, header=True):
        worksheet.append(row)
        # Словарь для отслеживания начальных индексов строк групп одинаковых значений
    merge_groups = {}

    # Проверяем каждый столбец на наличие групп одинаковых значений и объединяем их
    for col_idx, column in enumerate(df.columns, start=1):
        prev_value = None
        start_row = None
        for row_idx, cell in enumerate(worksheet.iter_rows(min_row=2, min_col=col_idx, max_col=col_idx), start=2):
            value = cell[0].value
            if value == prev_value:
                if start_row is None:
                    start_row = row_idx - 1
                end_row = row_idx
            elif start_row is not None:
                merge_groups[(col_idx, start_row)] = end_row
                start_row = None
            prev_value = value
        if start_row is not None:
            merge_groups[(col_idx, start_row)] = end_row

    # Объединяем ячейки с одинаковыми значениями
    for (col_idx, start_row), end_row in merge_groups.items():
        worksheet.merge_cells(start_row=start_row, end_row=end_row, start_column=col_idx, end_column=col_idx)

    # Устанавливаем максимальную ширину столбцов
    for col in worksheet.columns:
        max_length = max(len(str(cell.value)) for cell in col)
        adjusted_width = min(350, (max_length + 2) * 1.2)
        worksheet.column_dimensions[col[0].column_letter].width = adjusted_width

    # Сохраняем Workbook в файл

    # Устанавливаем выравнивание для переноса текста
    for row in worksheet.iter_rows():
        for cell in row:
            cell.alignment = Alignment(wrapText=True)

    # Автоматически подгоняем высоту строк
    for row in worksheet.iter_rows():
        max_height = 0
        for cell in row:
            if isinstance(cell.value, str):
                lines = cell.value.split("\n")
                height = max(len(line) // 100 + 1 for line in lines)
                if height > max_height:
                    max_height = height
            # if cell.value:
            border = Border(
                left=Side(border_style="thin"),
                right=Side(border_style="thin"),
                top=Side(border_style="thin"),
                bottom=Side(border_style="thin"),
            )
            cell.border = border
        worksheet.row_dimensions[row[0].row].height = (
            max_height * 15
        )  # 15 - это высота одной строки (подгоните под ваш шрифт)

    # Сохраняем Workbook в файл
    workbook.save(output)

    return output
