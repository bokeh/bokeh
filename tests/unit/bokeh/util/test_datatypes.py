#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
import numpy as np

# Module under test
import bokeh.util.datatypes as bud # isort:skip

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_is_sequence_like:
    @pytest.mark.parametrize('obj', [
        [],
        (),
        range(3),
        np.array([1, 2, 3]),
    ])
    def test_accepts_sized_iterables(self, obj: object) -> None:
        assert bud.is_sequence_like(obj)

    @pytest.mark.parametrize('obj', [
        "",
        "abc",
        b"",
        b"abc",
        {},
        {"a": 1},
        set(),
        {1, 2, 3},
        frozenset(),
        frozenset({1, 2, 3}),
        (i for i in range(3)),
        10,
        None,
    ])
    def test_rejects_non_sequences_and_special_cases(self, obj: object) -> None:
        assert not bud.is_sequence_like(obj)
