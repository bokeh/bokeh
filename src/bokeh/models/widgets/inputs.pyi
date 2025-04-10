#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import (
    Any,
    Literal,
    Sequence,
    TypeAlias,
)

# Bokeh imports
from ..._types import (
    Color,
    ColorHex,
    NonNegative,
    Positive,
    Readonly,
)
from ...core.enums import AutoType as Auto
from ...core.has_props import abstract
from ...core.property_aliases import IconLikeType as IconLike
from ...events import ModelEvent
from ..dom import HTML
from ..formatters import TickFormatter
from ..ui import Tooltip
from .widget import Widget

@dataclass
class ClearInput(ModelEvent):

    def __init__(self, model: InputWidget) -> None: ...

@abstract
@dataclass(init=False)
class InputWidget(Widget):

    title: str | HTML = ...

    description: str | Tooltip | None = ...

@dataclass
class FileInput(InputWidget):

    value: Readonly[str | list[str]] = ...

    mime_type: Readonly[str | list[str]] = ...

    filename: Readonly[str | list[str]] = ...

    accept: str | list[str] = ...

    multiple: bool = ...

    directory: bool = ...

    def clear(self) -> None: ...

@dataclass
class NumericInput(InputWidget):

    value: None | float | int = ...

    low: None | float | int = ...

    high: None | float | int = ...

    placeholder: str = ...

    mode: Literal["int", "float"] = ...

    format: None | str | TickFormatter = ...

@dataclass
class Spinner(NumericInput):

    value_throttled: Readonly[int | float | None] = ...

    step: float = ...

    page_step_multiplier: float = ...

    wheel_wait: int | float = ...

@abstract
@dataclass(init=False)
class ToggleInput(Widget):

    active: bool = ...

    label: str = ...

@dataclass
class Checkbox(ToggleInput):
    ...

@dataclass
class Switch(ToggleInput):

    on_icon: IconLike | None = ...

    off_icon: IconLike | None = ...

@dataclass
class TextLikeInput(InputWidget):

    value: str = ...

    value_input: str = ...

    placeholder: str = ...

    max_length: int | None = ...

@dataclass
class TextInput(TextLikeInput):

    prefix: str | None = ...

    suffix: str | None = ...

@dataclass
class TextAreaInput(TextLikeInput):

    cols: int = ...

    rows: int = ...

@dataclass
class PasswordInput(TextInput):
    ...

@dataclass
class AutocompleteInput(TextInput):

    completions: list[str] = ...

    max_completions: Positive[int] | None = ...

    min_characters: NonNegative[int] = ...

    case_sensitive: bool = ...

    restrict: bool = ...

    search_strategy: Literal["starts_with", "includes"] = ...

Options: TypeAlias = list[str | tuple[Any, str]]
OptionsGroups: TypeAlias = dict[str, Options]

@dataclass
class Select(InputWidget):

    options: Options | OptionsGroups | list[str | None] = ...

    value: Any = ...

@dataclass
class MultiSelect(InputWidget):

    options: list[str | tuple[str, str]] = ...

    value: list[str] = ...

    size: int = ...

@dataclass
class MultiChoice(InputWidget):

    options: list[str | tuple[str, str]] = ...

    value: list[str] = ...

    delete_button: bool = ...

    max_items: int | None = ...

    option_limit: int | None = ...

    search_option_limit: int | None = ...

    placeholder: str | None = ...

    solid: bool = ...

@dataclass
class ColorPicker(InputWidget):

    color: ColorHex = ...

@dataclass
class PaletteSelect(InputWidget):

    value: str = ...

    items: Sequence[tuple[str, Sequence[Color]]] = ...

    swatch_width: NonNegative[int] = ...

    swatch_height: Auto | NonNegative[int] = ...

    ncols: Positive[int] = ...

def ColorMap(*args: Any, **kwargs: Any) -> PaletteSelect: ...
