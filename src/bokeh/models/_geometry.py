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


def geometry_value(value: Any, *, preserve_arrays: bool = True) -> Any:
    if isinstance(value, np.ndarray):
        if preserve_arrays:
            return value
        value = value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, Mapping):
        return {key: geometry_value(item, preserve_arrays=preserve_arrays) for key, item in value.items()}
    if isinstance(value, list) or (not preserve_arrays and isinstance(value, tuple)):
        return [geometry_value(item, preserve_arrays=preserve_arrays) for item in value]
    return value
