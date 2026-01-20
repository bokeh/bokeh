#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import (
    Any,
    Literal,
    Sequence,
    TypeAlias,
    Unpack,
)

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
from .widget import Widget, WidgetInit

class ClearInput(ModelEvent):
    def __init__(self, model: InputWidget) -> None: ...

class InputWidgetInit(WidgetInit, total=False):
    title: str | HTML
    description: str | Tooltip | None

class InputWidget(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[InputWidgetInit]) -> None: ...

    title: str | HTML = ...
    description: str | Tooltip | None = ...

class FileInputInit(InputWidgetInit, total=False):
    accept: str | list[str]
    multiple: bool
    directory: bool

class FileInput(InputWidget):
    def __init__(self, **kwargs: Unpack[FileInputInit]) -> None: ...

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

class NumericInputInit(InputWidgetInit, total=False):
    value: None | float | int
    low: None | float | int
    high: None | float | int
    placeholder: str
    mode: Literal["int", "float"]
    format: None | str | TickFormatter

class NumericInput(InputWidget):
    def __init__(self, **kwargs: Unpack[NumericInputInit]) -> None: ...

    value: None | float | int = ...
    low: None | float | int = ...
    high: None | float | int = ...
    placeholder: str = ...
    mode: Literal["int", "float"] = ...
    format: None | str | TickFormatter = ...

class SpinnerInit(NumericInputInit, total=False):
    step: float
    page_step_multiplier: float
    wheel_wait: int | float

class Spinner(NumericInput):
    def __init__(self, **kwargs: Unpack[SpinnerInit]) -> None: ...

    @property
    def value_throttled(self) -> int | float | None: ...

    step: float = ...
    page_step_multiplier: float = ...
    wheel_wait: int | float = ...

class ToggleInputInit(WidgetInit, total=False):
    active: bool
    label: str

class ToggleInput(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ToggleInputInit]) -> None: ...

    active: bool = ...
    label: str = ...

class CheckboxInit(ToggleInputInit, total=False):
    ...

class Checkbox(ToggleInput):
    def __init__(self, **kwargs: Unpack[CheckboxInit]) -> None: ...

class SwitchInit(ToggleInputInit, total=False):
    on_icon: IconLike | None
    off_icon: IconLike | None

class Switch(ToggleInput):
    def __init__(self, **kwargs: Unpack[SwitchInit]) -> None: ...

    on_icon: IconLike | None = ...
    off_icon: IconLike | None = ...

class TextLikeInputInit(InputWidgetInit, total=False):
    value: str
    value_input: str
    placeholder: str
    max_length: int | None

class TextLikeInput(InputWidget):
    def __init__(self, **kwargs: Unpack[TextLikeInputInit]) -> None: ...

    value: str = ...
    value_input: str = ...
    placeholder: str = ...
    max_length: int | None = ...

class TextInputInit(TextLikeInputInit, total=False):
    prefix: str | None
    suffix: str | None

class TextInput(TextLikeInput):
    def __init__(self, **kwargs: Unpack[TextInputInit]) -> None: ...

    prefix: str | None = ...
    suffix: str | None = ...

class TextAreaInputInit(TextLikeInputInit, total=False):
    cols: int
    rows: int

class TextAreaInput(TextLikeInput):
    def __init__(self, **kwargs: Unpack[TextAreaInputInit]) -> None: ...

    cols: int = ...
    rows: int = ...

class PasswordInputInit(TextInputInit, total=False):
    ...

class PasswordInput(TextInput):
    def __init__(self, **kwargs: Unpack[PasswordInputInit]) -> None: ...

class AutocompleteInputInit(TextInputInit, total=False):
    completions: list[str]
    max_completions: Positive[int] | None
    min_characters: NonNegative[int]
    case_sensitive: bool
    restrict: bool
    search_strategy: Literal["starts_with", "includes"]

class AutocompleteInput(TextInput):
    def __init__(self, **kwargs: Unpack[AutocompleteInputInit]) -> None: ...

    completions: list[str] = ...
    max_completions: Positive[int] | None = ...
    min_characters: NonNegative[int] = ...
    case_sensitive: bool = ...
    restrict: bool = ...
    search_strategy: Literal["starts_with", "includes"] = ...

Options: TypeAlias = list[str | tuple[Any, str]]
OptionsGroups: TypeAlias = dict[str, Options]

class SelectInit(InputWidgetInit, total=False):
    options: Options | OptionsGroups | list[str | None]
    value: Any

class Select(InputWidget):
    def __init__(self, **kwargs: Unpack[SelectInit]) -> None: ...

    @property
    def options(self) -> Options | OptionsGroups: ...
    @options.setter
    def options(self, options: Options | OptionsGroups | list[str | None]) -> None: ...

    value: Any = ...

class MultiSelectInit(InputWidgetInit, total=False):
    options: list[str | tuple[str, str]]
    value: list[str]
    size: int

class MultiSelect(InputWidget):
    def __init__(self, **kwargs: Unpack[MultiSelectInit]) -> None: ...

    options: list[str | tuple[str, str]] = ...
    value: list[str] = ...
    size: int = ...

class MultiChoiceInit(InputWidgetInit, total=False):
    options: list[str | tuple[str, str]]
    value: list[str]
    delete_button: bool
    max_items: int | None
    option_limit: int | None
    search_option_limit: int | None
    placeholder: str | None
    solid: bool

class MultiChoice(InputWidget):
    def __init__(self, **kwargs: Unpack[MultiChoiceInit]) -> None: ...

    options: list[str | tuple[str, str]] = ...
    value: list[str] = ...
    delete_button: bool = ...
    max_items: int | None = ...
    option_limit: int | None = ...
    search_option_limit: int | None = ...
    placeholder: str | None = ...
    solid: bool = ...

class ColorPickerInit(InputWidgetInit, total=False):
    color: ColorHex

class ColorPicker(InputWidget):
    def __init__(self, **kwargs: Unpack[ColorPickerInit]) -> None: ...

    color: ColorHex = ...

class PaletteSelectInit(InputWidgetInit, total=False):
    value: str
    items: Sequence[tuple[str, Sequence[Color]]]
    swatch_width: NonNegative[int]
    swatch_height: Auto | NonNegative[int]
    ncols: Positive[int]

class PaletteSelect(InputWidget):
    def __init__(self, **kwargs: Unpack[PaletteSelectInit]) -> None: ...

    value: str = ...
    items: Sequence[tuple[str, Sequence[Color]]] = ...
    swatch_width: NonNegative[int] = ...
    swatch_height: Auto | NonNegative[int] = ...
    ncols: Positive[int] = ...

def ColorMap(*args: Any, **kwargs: Any) -> PaletteSelect: ...
