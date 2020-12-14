#   -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import logging
from datetime import date, datetime

# Bokeh imports
from bokeh.core.validation.check import check_integrity
from bokeh.util.logconfig import basicConfig
from bokeh.util.serialization import convert_date_to_datetime, convert_datetime_type

# Module under test
from bokeh.models.widgets import DatePicker

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class TestDatePicker:
    def test_setting_value_as_date_time(self) -> None:
        set_date = "2017-02-01"
        s = DatePicker(value=set_date)
        assert s.value == (set_date)

    def test_value_in_custom_format(self) -> None:
        set_date = "2019-02-01"
        s = DatePicker(value="02 01 2019", date_format="m d Y")
        assert s.value == (set_date)

    def test_min_max_dates(self) -> None:
        s = DatePicker(value="2017-09-01", min_date="2019-08-01", max_date="2019-10-30")
        assert s.min_date == "2019-08-01"
        assert s.max_date == "2019-10-30"

    def test_min_max_dates_custom_formats(self) -> None:
        s = DatePicker(value="09 01 2019", min_date="08 01 2019", max_date="10 30 2019")
        assert s.min_date == "2019-08-01"
        assert s.max_date == "2019-10-30"


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
