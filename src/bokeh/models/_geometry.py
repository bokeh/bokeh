#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np


def geometry_value(value: Any) -> Any:
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, Mapping):
        return {key: geometry_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return type(value)(geometry_value(item) for item in value)
    return value
