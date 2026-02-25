#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Any, Literal

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..._specs import ColorSpec, FontStyleSpec, TextAlignSpec
from ...core.enums import (
    AutosizeModeType as AutosizeMode,
    DateFormatType as DateFormat,
    NumeralLanguageType as NumeralLanguage,
    RoundingFunctionType as RoundingFunction,
)
from ...model.model import Model
from ..comparisons import Comparison
from ..sources import (
    CDSView,
    ColumnDataSource,
    DataDictLike,
    DataSource,
)
from .widget import Widget

from ..._types import NonNegative
from ...core.enums import AlignType as Align
from ...core.enums import AutoType as Auto
from ...core.enums import DimensionsType as Dimensions
from ...core.enums import FlowModeType as FlowMode
from ...core.enums import SizingModeType as SizingMode
from ...core.enums import SizingPolicyType as SizingPolicy
from ...model.model import JSEventCallback
from ..css import StyleSheet
from ..css import Styles
from ..dom import DOMNode
from ..nodes import Node
from ..ui.menus import Menu
from ..ui.ui_element import UIElement
from typing import Sequence
from typing import TypedDict

class _CellFormatterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class CellFormatter(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CellFormatterInit]) -> None: ...

class _CellEditorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class CellEditor(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CellEditorInit]) -> None: ...

class _RowAggregatorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    field_: str

class RowAggregator(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_RowAggregatorInit]) -> None: ...

    field_: str = ...

class _StringFormatterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    font_style: FontStyleSpec
    text_align: TextAlignSpec
    text_color: ColorSpec
    background_color: ColorSpec
    nan_format: str
    null_format: str

class StringFormatter(CellFormatter):
    def __init__(self, **kwargs: Unpack[_StringFormatterInit]) -> None: ...

    font_style: FontStyleSpec = ...
    text_align: TextAlignSpec = ...
    text_color: ColorSpec = ...
    background_color: ColorSpec = ...
    nan_format: str = ...
    null_format: str = ...

class _ScientificFormatterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    font_style: FontStyleSpec
    text_align: TextAlignSpec
    text_color: ColorSpec
    background_color: ColorSpec
    nan_format: str
    null_format: str
    precision: int
    power_limit_high: int
    power_limit_low: int

class ScientificFormatter(StringFormatter):
    def __init__(self, **kwargs: Unpack[_ScientificFormatterInit]) -> None: ...

    precision: int = ...
    power_limit_high: int = ...
    power_limit_low: int = ...

class _NumberFormatterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    font_style: FontStyleSpec
    text_align: TextAlignSpec
    text_color: ColorSpec
    background_color: ColorSpec
    nan_format: str
    null_format: str
    format: str
    language: NumeralLanguage
    rounding: RoundingFunction

class NumberFormatter(StringFormatter):
    def __init__(self, **kwargs: Unpack[_NumberFormatterInit]) -> None: ...

    format: str = ...
    language: NumeralLanguage = ...
    rounding: RoundingFunction = ...

class _BooleanFormatterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    icon: Literal["check", "check-circle", "check-circle-o", "check-square", "check-square-o"]

class BooleanFormatter(CellFormatter):
    def __init__(self, **kwargs: Unpack[_BooleanFormatterInit]) -> None: ...

    icon: Literal["check", "check-circle", "check-circle-o", "check-square", "check-square-o"] = ...

class _DateFormatterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    font_style: FontStyleSpec
    text_align: TextAlignSpec
    text_color: ColorSpec
    background_color: ColorSpec
    nan_format: str
    null_format: str
    format: DateFormat | str

class DateFormatter(StringFormatter):
    def __init__(self, **kwargs: Unpack[_DateFormatterInit]) -> None: ...

    format: DateFormat | str = ...

class _HTMLTemplateFormatterInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    template: str

class HTMLTemplateFormatter(CellFormatter):
    def __init__(self, **kwargs: Unpack[_HTMLTemplateFormatterInit]) -> None: ...

    template: str = ...

class _StringEditorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    completions: list[str]

class StringEditor(CellEditor):
    def __init__(self, **kwargs: Unpack[_StringEditorInit]) -> None: ...

    completions: list[str] = ...

class _TextEditorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class TextEditor(CellEditor):
    def __init__(self, **kwargs: Unpack[_TextEditorInit]) -> None: ...

class _SelectEditorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    options: list[str]

class SelectEditor(CellEditor):
    def __init__(self, **kwargs: Unpack[_SelectEditorInit]) -> None: ...

    options: list[str] = ...

class _PercentEditorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class PercentEditor(CellEditor):
    def __init__(self, **kwargs: Unpack[_PercentEditorInit]) -> None: ...

class _CheckboxEditorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class CheckboxEditor(CellEditor):
    def __init__(self, **kwargs: Unpack[_CheckboxEditorInit]) -> None: ...

class _IntEditorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    step: int

class IntEditor(CellEditor):
    def __init__(self, **kwargs: Unpack[_IntEditorInit]) -> None: ...

    step: int = ...

class _NumberEditorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    step: float

class NumberEditor(CellEditor):
    def __init__(self, **kwargs: Unpack[_NumberEditorInit]) -> None: ...

    step: float = ...

class _TimeEditorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class TimeEditor(CellEditor):
    def __init__(self, **kwargs: Unpack[_TimeEditorInit]) -> None: ...

class _DateEditorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class DateEditor(CellEditor):
    def __init__(self, **kwargs: Unpack[_DateEditorInit]) -> None: ...

class _AvgAggregatorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    field_: str

class AvgAggregator(RowAggregator):
    def __init__(self, **kwargs: Unpack[_AvgAggregatorInit]) -> None: ...

class _MinAggregatorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    field_: str

class MinAggregator(RowAggregator):
    def __init__(self, **kwargs: Unpack[_MinAggregatorInit]) -> None: ...

class _MaxAggregatorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    field_: str

class MaxAggregator(RowAggregator):
    def __init__(self, **kwargs: Unpack[_MaxAggregatorInit]) -> None: ...

class _SumAggregatorInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    field_: str

class SumAggregator(RowAggregator):
    def __init__(self, **kwargs: Unpack[_SumAggregatorInit]) -> None: ...

class _TableColumnInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    field: str
    title: str | None
    width: int
    formatter: CellFormatter
    editor: CellEditor
    sortable: bool
    default_sort: Literal["ascending", "descending"]
    visible: bool
    sorter: Comparison | None

class TableColumn(Model):
    def __init__(self, **kwargs: Unpack[_TableColumnInit]) -> None: ...

    field: str = ...
    title: str | None = ...
    width: int = ...
    formatter: CellFormatter = ...
    editor: CellEditor = ...
    sortable: bool = ...
    default_sort: Literal["ascending", "descending"] = ...
    visible: bool = ...
    sorter: Comparison | None = ...

class _TableWidgetInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    html_attributes: dict[str, str]
    html_id: str | None
    css_classes: Sequence[str]
    css_variables: dict[str, str | Node]
    styles: dict[str, str | None] | Styles
    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]]
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions
    source: DataSource
    view: CDSView

class TableWidget(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_TableWidgetInit]) -> None: ...

    source: DataSource = ...
    view: CDSView = ...

class _DataTableInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    html_attributes: dict[str, str]
    html_id: str | None
    css_classes: Sequence[str]
    css_variables: dict[str, str | Node]
    styles: dict[str, str | None] | Styles
    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]]
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions
    source: DataSource
    view: CDSView
    autosize_mode: AutosizeMode
    auto_edit: bool
    columns: list[TableColumn]
    fit_columns: bool | None
    frozen_columns: int | None
    frozen_rows: int | None
    sortable: bool
    reorderable: bool
    editable: bool
    selectable: bool | Literal["checkbox"]
    index_position: int | None
    index_header: str
    index_width: int
    scroll_to_selection: bool
    header_row: bool
    row_height: int

class DataTable(TableWidget):
    def __init__(self, **kwargs: Unpack[_DataTableInit]) -> None: ...

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

class _GroupingInfoInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    getter: str
    aggregators: list[RowAggregator]
    collapsed: bool

class GroupingInfo(Model):
    def __init__(self, **kwargs: Unpack[_GroupingInfoInit]) -> None: ...

    getter: str = ...
    aggregators: list[RowAggregator] = ...
    collapsed: bool = ...

class _DataCubeInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    html_attributes: dict[str, str]
    html_id: str | None
    css_classes: Sequence[str]
    css_variables: dict[str, str | Node]
    styles: dict[str, str | None] | Styles
    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]]
    visible: bool
    context_menu: Menu | Auto | None
    elements: list[UIElement | DOMNode]
    disabled: bool
    width: NonNegative[int] | None
    height: NonNegative[int] | None
    min_width: NonNegative[int] | None
    min_height: NonNegative[int] | None
    max_width: NonNegative[int] | None
    max_height: NonNegative[int] | None
    margin: int | tuple[int, int] | tuple[int, int, int, int] | None
    width_policy: Auto | SizingPolicy
    height_policy: Auto | SizingPolicy
    aspect_ratio: None | Auto | float
    flow_mode: FlowMode
    sizing_mode: SizingMode | None
    align: Auto | Align | tuple[Align, Align]
    resizable: bool | Dimensions
    source: DataSource
    view: CDSView
    autosize_mode: AutosizeMode
    auto_edit: bool
    columns: list[TableColumn]
    fit_columns: bool | None
    frozen_columns: int | None
    frozen_rows: int | None
    sortable: bool
    reorderable: bool
    editable: bool
    selectable: bool | Literal["checkbox"]
    index_position: int | None
    index_header: str
    index_width: int
    scroll_to_selection: bool
    header_row: bool
    row_height: int
    grouping: list[GroupingInfo]
    target: DataSource

class DataCube(DataTable):
    def __init__(self, **kwargs: Unpack[_DataCubeInit]) -> None: ...

    grouping: list[GroupingInfo] = ...
    target: DataSource = ...
