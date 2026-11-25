#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Any, Sequence

# Bokeh imports
from ...model import Model
from ..callbacks import Callback, CustomJS

type KeyCombination = str # TODO

@dataclass
class KeyBinding(Model):

    description: str | None = ...

    keys: KeyCombination | Sequence[KeyCombination] = ...

    command: str | None = ...

    args: dict[str, Any] = ...

    when: CustomJS | None = ...

    action: Callback | None = ...

    priority: int = ...
