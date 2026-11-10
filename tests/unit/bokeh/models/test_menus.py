# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

import pytest

from bokeh.models.ui.menus import CheckableItem, MenuItem


@pytest.mark.parametrize("checked", [False, True])
def test_checkable_item_replacement(checked: bool) -> None:
    message = r"MenuItem\(checked=True\) or MenuItem\(checked=False\)"
    with pytest.warns(DeprecationWarning, match=message) as warnings:
        legacy = CheckableItem(label="Check", checked=checked)

    assert len(warnings) == 1
    replacement = MenuItem(label="Check", checked=checked)
    assert replacement.properties_with_values() == legacy.properties_with_values()
