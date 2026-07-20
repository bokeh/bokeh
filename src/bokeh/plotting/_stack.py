#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from ..transform import stack
from ..util.datatypes import SequenceLike, is_SequenceLike

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'double_stack',
    'single_stack',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def _validate_stackers(stackers: object) -> None:
    if not is_SequenceLike(stackers):
        raise ValueError("Stackers must be a sequence")

def single_stack(stackers: SequenceLike[str], spec: str, **kw: Any) -> list[dict[str, Any]]:
    _validate_stackers(stackers)

    if spec in kw:
        raise ValueError(f"Stack property '{spec}' cannot appear in keyword args")

    lengths = { len(x) for x in kw.values() if isinstance(x, (list, tuple)) }

    # lengths will be empty if there are no kwargs supplied at all
    if len(lengths) > 0:
        if len(lengths) != 1:
            raise ValueError(f"Keyword argument sequences for broadcasting must all be the same lengths. Got lengths: {sorted(list(lengths))!r}")
        if lengths.pop() != len(stackers):
            raise ValueError("Keyword argument sequences for broadcasting must be the same length as stackers")

    s = []

    _kw = []

    for i, val in enumerate(stackers):
        d  = {'name': val}
        s.append(val)

        d[spec] = stack(*s)

        for k, v in kw.items():
            if isinstance(v, (list, tuple)):
                d[k] = v[i]
            else:
                d[k] = v

        _kw.append(d)

    return _kw

def double_stack(stackers: SequenceLike[str], spec0: str, spec1: str, **kw: Any) -> list[dict[str, Any]]:
    _validate_stackers(stackers)

    for name in (spec0, spec1):
        if name in kw:
            raise ValueError(f"Stack property '{name}' cannot appear in keyword args")

    lengths = { len(x) for x in kw.values() if isinstance(x, (list, tuple)) }

    # lengths will be empty if there are no kwargs supplied at all
    if len(lengths) > 0:
        if len(lengths) != 1:
            raise ValueError(f"Keyword argument sequences for broadcasting must all be the same lengths. Got lengths: {sorted(list(lengths))!r}")
        if lengths.pop() != len(stackers):
            raise ValueError("Keyword argument sequences for broadcasting must be the same length as stackers")

    s0 = []
    s1 = []

    _kw = []

    for i, val in enumerate(stackers):
        d  = {'name': val}
        s0 = list(s1)
        s1.append(val)

        d[spec0] = stack(*s0)
        d[spec1] = stack(*s1)

        for k, v in kw.items():
            if isinstance(v, (list, tuple)):
                d[k] = v[i]
            else:
                d[k] = v

        _kw.append(d)

    return _kw

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
