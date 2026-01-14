#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Sequence, TypeAlias

# Bokeh imports
from ...model import Model
from ..callbacks import Callback

KeyCombination: TypeAlias = str # TODO

@dataclass
class KeyBinding(Model):

    description: str = ...

    keys: KeyCombination | Sequence[KeyCombination] = ...

    command: str | None = ...

    when: Callback | None = ...

    action: Callback = ...

    priority: int = ...
