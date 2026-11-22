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

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from types import SimpleNamespace

import pytest

# Module under test
from bokeh.core.collections import Many # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestMany:
    def test_set(self) -> None:
        items = Many([SimpleNamespace(value=0), SimpleNamespace(value=0)])

        items.value = 10

        assert [item.value for item in items] == [10, 10]

    def test_set_empty(self) -> None:
        items = Many([])

        with pytest.warns(UserWarning, match=r"Setting 'value' on an empty Many collection has no effect"):
            items.value = 10

        assert items == []

    def test_first_and_one(self) -> None:
        empty = Many[int]()
        single = Many([10])
        multiple = Many([10, 20])

        assert empty.first is None
        assert single.first == 10
        assert multiple.first == 10
        assert single.one() == 10

        with pytest.raises(ValueError, match="expected exactly one item, found 0"):
            empty.one()
        with pytest.raises(ValueError, match="expected exactly one item, found 2"):
            multiple.one()

    def test_get_nested(self) -> None:
        items = Many([
            SimpleNamespace(child=SimpleNamespace(value=10)),
            SimpleNamespace(child=SimpleNamespace(value=20)),
        ])

        assert items.child.value == [10, 20]

    def test_get_mismatch(self) -> None:
        items = Many([SimpleNamespace(value=10), object()])

        with pytest.raises(AttributeError, match=r"items have no 'value' attribute"):
            items.value

    def test_get_empty(self) -> None:
        items = Many([])

        with pytest.raises(AttributeError, match=r"Trying to access 'value' attribute on an empty Many collection"):
            items.value

    def test_list_operations(self) -> None:
        items = Many([1, 2, 3])

        assert items.index(2) == 1
        assert items.pop(1) == 2
        assert items == [1, 3]

    def test_dir(self) -> None:
        items = Many([SimpleNamespace(value=10)])

        assert "first" in dir(items)
        assert "one" in dir(items)
        assert "value" in dir(items)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
