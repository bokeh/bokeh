#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Any

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
