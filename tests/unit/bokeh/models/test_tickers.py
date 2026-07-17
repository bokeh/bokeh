# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations  # isort:skip

import pytest ; pytest

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

from _util_models import check_properties_existence

# Module under test
import bokeh.models.tickers as bmt  # isort:skip

# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------


class Test_ContinousTicker:
    invalid_tick_numbers = [-1, 1.0, 1001]

    def test_basic(self) -> None:
        t = bmt.ContinuousTicker()
        check_properties_existence(t, ["num_minor_ticks", "desired_num_ticks"])

    def test_init_with_no_argument(self) -> None:
        t = bmt.ContinuousTicker()
        assert t.num_minor_ticks == 5
        assert t.desired_num_ticks == 6

    def test_invalid_num_minor_tick_number(self) -> None:
        for tick_number in self.invalid_tick_numbers:
            with pytest.raises(ValueError):
                bmt.ContinuousTicker(num_minor_ticks=tick_number)

            t = bmt.ContinuousTicker()
            with pytest.raises(ValueError):
                t.num_minor_ticks = tick_number

    def test_invalid_desired_tick_number(self) -> None:
        for tick_number in self.invalid_tick_numbers:
            with pytest.raises(ValueError):
                bmt.ContinuousTicker(num_minor_ticks=tick_number)

            t = bmt.ContinuousTicker()
            with pytest.raises(ValueError):
                t.num_minor_ticks = tick_number


# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
