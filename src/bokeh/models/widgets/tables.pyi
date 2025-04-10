#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Any, Literal

# Bokeh imports
from ..._specs import ColorSpec, FontStyleSpec, TextAlignSpec
from ...core.enums import (
    AutosizeModeType as AutosizeMode,
    DateFormatType as DateFormat,
    NumeralLanguageType as NumeralLanguage,
    RoundingFunctionType as RoundingFunction,
)
from ...core.has_props import abstract
from ...model import Model
from ..comparisons import Comparison
from ..sources import (
    CDSView,
    ColumnDataSource,
    DataDictLike,
    DataSource,
)
from .widget import Widget

@abstract
@dataclass(init=False)
class CellFormatter(Model):
    ...

@abstract
@dataclass(init=False)
class CellEditor(Model):
    ...

@abstract
@dataclass(init=False)
class RowAggregator(Model):

    field_: str = ...

@dataclass
class StringFormatter(CellFormatter):

    font_style: FontStyleSpec = ...

    text_align: TextAlignSpec = ...

    text_color: ColorSpec = ...

    background_color: ColorSpec = ...

    nan_format: str = ...

    null_format: str = ...

@dataclass
class ScientificFormatter(StringFormatter):

    precision: int = ...

    power_limit_high: int = ...

    power_limit_low: int = ...

@dataclass
class NumberFormatter(StringFormatter):

    format: str = ...

    language: NumeralLanguage = ...

    rounding: RoundingFunction = ...

@dataclass
class BooleanFormatter(CellFormatter):

    icon: Literal["check", "check-circle", "check-circle-o", "check-square", "check-square-o"] = ...

@dataclass
class DateFormatter(StringFormatter):

    format: DateFormat | str = ...

@dataclass
class HTMLTemplateFormatter(CellFormatter):

    template: str = ...

@dataclass
class StringEditor(CellEditor):

    completions: list[str] = ...

@dataclass
class TextEditor(CellEditor):
    ...

@dataclass
class SelectEditor(CellEditor):

    options: list[str] = ...

@dataclass
class PercentEditor(CellEditor):
    ...

@dataclass
class CheckboxEditor(CellEditor):
    ...

@dataclass
class IntEditor(CellEditor):

    step: int = ...

@dataclass
class NumberEditor(CellEditor):

    step: float = ...

@dataclass
class TimeEditor(CellEditor):
    ...

@dataclass
class DateEditor(CellEditor):
    ...

@dataclass
class AvgAggregator(RowAggregator):
    ...

@dataclass
class MinAggregator(RowAggregator):
    ...

@dataclass
class MaxAggregator(RowAggregator):
    ...

@dataclass
class SumAggregator(RowAggregator):
    ...

@dataclass
class TableColumn(Model):

    field: str = ...

    title: str | None = ...

    width: int = ...

    formatter: CellFormatter = ...

    editor: CellEditor = ...

    sortable: bool = ...

    default_sort: Literal["ascending", "descending"] = ...

    visible: bool = ...

    sorter: Comparison | None = ...

@abstract
@dataclass(init=False)
class TableWidget(Widget):

    source: DataSource = ...

    view: CDSView = ...

@dataclass
class DataTable(TableWidget):

    autosize_mode: AutosizeMode = ...

    auto_edit: bool = ...

    columns: list[TableColumn] = ...

    fit_columns: bool | None = ...

    frozen_columns: int | None = ...

    frozen_rows: int | None = ...

    sortable: bool = ...

    reorderable: bool = ...

    editable: bool = ...

    selectable: bool | Literal["checkbox"] = ...

    index_position: int | None = ...

    index_header: str = ...

    index_width: int = ...

    scroll_to_selection: bool = ...

    header_row: bool = ...

    row_height: int = ...

    @staticmethod
    def from_data(data: ColumnDataSource | DataDictLike, columns: list[str] | None = None,
                  formatters: dict[str, CellFormatter] = {}, **kwargs: Any) -> DataTable: ...

@dataclass
class GroupingInfo(Model):

    getter: str = ...

    aggregators: list[RowAggregator] = ...

    collapsed: bool = ...

@dataclass
class DataCube(DataTable):

    grouping: list[GroupingInfo] = ...

    target: DataSource = ...
