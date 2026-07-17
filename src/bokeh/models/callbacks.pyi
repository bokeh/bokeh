#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# pyright: reportMissingImports=false

# Standard library imports
import sys
from dataclasses import dataclass
from typing import Any

if sys.version_info[:2] >= (3, 14):
    from string.templatelib import Template  # novermin

# Bokeh imports
from ..core.enums import AutoType as Auto
from ..core.has_props import HasProps, abstract
from ..core.types import PathLike
from ..model import Model
from ..models.ui import Dialog, UIElement

@abstract
@dataclass(init=False)
class Callback(Model):
    ...

@dataclass
class OpenURL(Callback):

    url: str = ...

    same_tab: bool = ...

@abstract
@dataclass(init=False)
class CustomCode(Callback):
    ...

@dataclass
class CustomJS(CustomCode):

    args: dict[str, Any] = ...

    code: str = ...

    module: Auto | bool = ...

    @classmethod
    def from_file(cls, path: PathLike, **args: Any) -> CustomJS: ...

    if sys.version_info[:2] >= (3, 14):
        @classmethod
        def from_template(cls, template: Template) -> CustomJS: ... # pyright: ignore[reportInvalidTypeForm]

@dataclass
class SetValue(Callback):

    obj: HasProps = ...

    attr: str = ...

    value: Any = ...

@dataclass
class ToggleVisibility(Callback):

    target: UIElement = ...

@dataclass
class OpenDialog(Callback):

    dialog: Dialog = ...

@dataclass
class CloseDialog(Callback):

    dialog: Dialog = ...
