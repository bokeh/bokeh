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

# Standard library imports
from datetime import datetime

# Bokeh imports
from bokeh.document import Document

# Module under test
import bokeh.models.widgets.pickers as mwp # isort:skip

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.mark.parametrize("value", [
    "2026-09-15T17:10:51",
    datetime(2026, 9, 15, 17, 10, 51),
])
def test_datetime_picker_initial_value(value) -> None:
    picker = mwp.DatetimePicker(value=value)
    assert picker.value == 1789492251000.0

@pytest.mark.parametrize("value", [
    ("2026-09-15T09:00:00", "2026-09-15T17:10:51"),
    (datetime(2026, 9, 15, 9), datetime(2026, 9, 15, 17, 10, 51)),
])
def test_datetime_range_picker_initial_value(value) -> None:
    picker = mwp.DatetimeRangePicker(value=value)
    assert picker.value == (1789462800000.0, 1789492251000.0)

@pytest.mark.parametrize("picker_type", [mwp.DatetimePicker, mwp.DatetimeRangePicker])
@pytest.mark.parametrize("bounds", [
    ("2026-09-15T09:00:00", "2026-09-15T17:10:51"),
    (datetime(2026, 9, 15, 9), datetime(2026, 9, 15, 17, 10, 51)),
])
def test_datetime_picker_bounds(picker_type, bounds) -> None:
    picker = picker_type(min_date=bounds[0], max_date=bounds[1])
    assert picker.min_date == 1789462800000.0
    assert picker.max_date == 1789492251000.0

@pytest.mark.parametrize("picker_type, initial, selected, expected_old, expected_new", [
    (
        mwp.DatetimePicker,
        "2026-09-15T09:00:00",
        "2026-09-15T17:10:51",
        1789462800000.0,
        1789492251000.0,
    ),
    (
        mwp.DatetimeRangePicker,
        ("2026-09-15T09:00:00", "2026-09-15T09:00:00"),
        ["2026-09-15T09:00:00", "2026-09-15T17:10:51"],
        (1789462800000.0, 1789462800000.0),
        (1789462800000.0, 1789492251000.0),
    ),
])
def test_datetime_picker_json_patch(picker_type, initial, selected, expected_old, expected_new) -> None:
    picker = picker_type(value=initial)
    doc = Document()
    doc.add_root(picker)
    changes = []
    picker.on_change("value", lambda attr, old, new: changes.append((old, new)))

    doc.apply_json_patch({"events": [{
        "kind": "ModelChanged",
        "model": {"id": picker.id},
        "attr": "value",
        "new": selected,
    }]})

    assert picker.value == expected_new
    assert changes == [(expected_old, expected_new)]
