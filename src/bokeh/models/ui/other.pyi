#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Sequence, TypeAlias

# Bokeh imports
from ...model import Model
from ..callbacks import Callback

KeyCombination: TypeAlias = str # TODO

class KeyBinding(Model):

    key: KeyCombination | Sequence[KeyCombination] = ...

    when: Callback | None = ...

    action: Callback = ...

    priority: int = ...
