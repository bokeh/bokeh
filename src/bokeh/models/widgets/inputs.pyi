#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import (
    TYPE_CHECKING,
    Any,
    Literal,
    Sequence,
    TypeAlias,
)

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..._types import (
    Color,
    ColorHex,
    NonNegative,
    Positive,
)
from ...core.enums import AutoType as Auto
from ...core.property_aliases import IconLikeType as IconLike
from ...events import ModelEvent
from ..dom import HTML
from ..formatters import TickFormatter
from ..ui import Tooltip
from .widget import Widget, _WidgetInit

class ClearInput(ModelEvent):
    def __init__(self, model: InputWidget) -> None: ...

class _InputWidgetInit(_WidgetInit, total=False):
    title: str | HTML
    description: str | Tooltip | None

class InputWidget(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_InputWidgetInit]) -> None: ...

    title: str | HTML = ...
    description: str | Tooltip | None = ...

class _FileInputInit(_InputWidgetInit, total=False):
    accept: str | list[str]
    multiple: bool
    directory: bool

class FileInput(InputWidget):
    def __init__(self, **kwargs: Unpack[_FileInputInit]) -> None: ...

    @property
    def value(self) -> str | list[str]: ...
    @property
    def mime_type(self) -> str | list[str]: ...
    @property
    def filename(self) -> str | list[str]: ...

    accept: str | list[str] = ...
    multiple: bool = ...
    directory: bool = ...

    def clear(self) -> None: ...

class _NumericInputInit(_InputWidgetInit, total=False):
    value: None | float | int
    low: None | float | int
    high: None | float | int
    placeholder: str
    mode: Literal["int", "float"]
    format: None | str | TickFormatter

class NumericInput(InputWidget):
    def __init__(self, **kwargs: Unpack[_NumericInputInit]) -> None: ...

    value: None | float | int = ...
    low: None | float | int = ...
    high: None | float | int = ...
    placeholder: str = ...
    mode: Literal["int", "float"] = ...
    format: None | str | TickFormatter = ...

class _SpinnerInit(_NumericInputInit, total=False):
    step: float
    page_step_multiplier: float
    wheel_wait: int | float

class Spinner(NumericInput):
    def __init__(self, **kwargs: Unpack[_SpinnerInit]) -> None: ...

    @property
    def value_throttled(self) -> int | float | None: ...

    step: float = ...
    page_step_multiplier: float = ...
    wheel_wait: int | float = ...

class _ToggleInputInit(_WidgetInit, total=False):
    active: bool
    label: str

class ToggleInput(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ToggleInputInit]) -> None: ...

    active: bool = ...
    label: str = ...

class _CheckboxInit(_ToggleInputInit, total=False):
    ...

class Checkbox(ToggleInput):
    def __init__(self, **kwargs: Unpack[_CheckboxInit]) -> None: ...

class _SwitchInit(_ToggleInputInit, total=False):
    on_icon: IconLike | None
    off_icon: IconLike | None

class Switch(ToggleInput):
    def __init__(self, **kwargs: Unpack[_SwitchInit]) -> None: ...

    on_icon: IconLike | None = ...
    off_icon: IconLike | None = ...

class _TextLikeInputInit(_InputWidgetInit, total=False):
    value: str
    value_input: str
    placeholder: str
    max_length: int | None

class TextLikeInput(InputWidget):
    def __init__(self, **kwargs: Unpack[_TextLikeInputInit]) -> None: ...

    value: str = ...
    value_input: str = ...
    placeholder: str = ...
    max_length: int | None = ...

class _TextInputInit(_TextLikeInputInit, total=False):
    prefix: str | None
    suffix: str | None

class TextInput(TextLikeInput):
    def __init__(self, **kwargs: Unpack[_TextInputInit]) -> None: ...

    prefix: str | None = ...
    suffix: str | None = ...

class _TextAreaInputInit(_TextLikeInputInit, total=False):
    cols: int
    rows: int

class TextAreaInput(TextLikeInput):
    def __init__(self, **kwargs: Unpack[_TextAreaInputInit]) -> None: ...

    cols: int = ...
    rows: int = ...

class _PasswordInputInit(_TextInputInit, total=False):
    ...

class PasswordInput(TextInput):
    def __init__(self, **kwargs: Unpack[_PasswordInputInit]) -> None: ...

class _AutocompleteInputInit(_TextInputInit, total=False):
    completions: list[str]
    max_completions: Positive[int] | None
    min_characters: NonNegative[int]
    case_sensitive: bool
    restrict: bool
    search_strategy: Literal["starts_with", "includes"]

class AutocompleteInput(TextInput):
    def __init__(self, **kwargs: Unpack[_AutocompleteInputInit]) -> None: ...

    completions: list[str] = ...
    max_completions: Positive[int] | None = ...
    min_characters: NonNegative[int] = ...
    case_sensitive: bool = ...
    restrict: bool = ...
    search_strategy: Literal["starts_with", "includes"] = ...

Options: TypeAlias = list[str | tuple[Any, str]]
OptionsGroups: TypeAlias = dict[str, Options]

class _SelectInit(_InputWidgetInit, total=False):
    options: Options | OptionsGroups | list[str | None]
    value: Any

class Select(InputWidget):
    def __init__(self, **kwargs: Unpack[_SelectInit]) -> None: ...

    @property
    def options(self) -> Options | OptionsGroups: ...
    @options.setter
    def options(self, options: Options | OptionsGroups | list[str | None]) -> None: ...

    value: Any = ...

class _MultiSelectInit(_InputWidgetInit, total=False):
    options: list[str | tuple[str, str]]
    value: list[str]
    size: int

class MultiSelect(InputWidget):
    def __init__(self, **kwargs: Unpack[_MultiSelectInit]) -> None: ...

    options: list[str | tuple[str, str]] = ...
    value: list[str] = ...
    size: int = ...

class _MultiChoiceInit(_InputWidgetInit, total=False):
    options: list[str | tuple[str, str]]
    value: list[str]
    delete_button: bool
    max_items: int | None
    option_limit: int | None
    search_option_limit: int | None
    placeholder: str | None
    solid: bool

class MultiChoice(InputWidget):
    def __init__(self, **kwargs: Unpack[_MultiChoiceInit]) -> None: ...

    options: list[str | tuple[str, str]] = ...
    value: list[str] = ...
    delete_button: bool = ...
    max_items: int | None = ...
    option_limit: int | None = ...
    search_option_limit: int | None = ...
    placeholder: str | None = ...
    solid: bool = ...

class _ColorPickerInit(_InputWidgetInit, total=False):
    color: ColorHex

class ColorPicker(InputWidget):
    def __init__(self, **kwargs: Unpack[_ColorPickerInit]) -> None: ...

    color: ColorHex = ...

class _PaletteSelectInit(_InputWidgetInit, total=False):
    value: str
    items: Sequence[tuple[str, Sequence[Color]]]
    swatch_width: NonNegative[int]
    swatch_height: Auto | NonNegative[int]
    ncols: Positive[int]

class PaletteSelect(InputWidget):
    def __init__(self, **kwargs: Unpack[_PaletteSelectInit]) -> None: ...

    value: str = ...
    items: Sequence[tuple[str, Sequence[Color]]] = ...
    swatch_width: NonNegative[int] = ...
    swatch_height: Auto | NonNegative[int] = ...
    ncols: Positive[int] = ...

def ColorMap(*args: Any, **kwargs: Any) -> PaletteSelect: ...
