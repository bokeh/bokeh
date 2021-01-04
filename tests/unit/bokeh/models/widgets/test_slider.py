#-----------------------------------------------------------------------------
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
import bokeh.models.widgets.sliders as mws # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class TestDateRangeSlider:
    def test_value_as_datetime_when_set_as_datetime(self) -> None:
        start = datetime(2017, 8, 9, 0, 0)
        end = datetime(2017, 8, 10, 0, 0)
        s = mws.DateRangeSlider(start=start, end=end, value=(start, end))
        assert s.value_as_datetime == (start, end)

    def test_value_as_datetime_when_set_as_timestamp(self) -> None:
        start = datetime(2017, 8, 9, 0, 0)
        end = datetime(2017, 8, 10, 0, 0)
        s = mws.DateRangeSlider(start=start, end=end,
            # Bokeh serializes as ms since epoch, if they get set as numbers (e.g.)
            # by client side update, this is the units they will be
            value=(convert_datetime_type(start), convert_datetime_type(end)))
        assert s.value_as_datetime == (start, end)

    def test_value_as_datetime_when_set_mixed(self) -> None:
        start = datetime(2017, 8, 9, 0, 0)
        end = datetime(2017, 8, 10, 0, 0)
        s = mws.DateRangeSlider(start=start, end=end,
                value=(start, convert_datetime_type(end)))
        assert s.value_as_datetime == (start, end)

        s = mws.DateRangeSlider(start=start, end=end,
                value=(convert_datetime_type(start), end))
        assert s.value_as_datetime == (start, end)

    def test_value_as_date_when_set_as_date(self) -> None:
        start = date(2017, 8, 9)
        end = date(2017, 8, 10)
        s = mws.DateRangeSlider(start=start, end=end, value=(start, end))
        assert s.value_as_date == (start, end)

    def test_value_as_date_when_set_as_timestamp(self) -> None:
        start = date(2017, 8, 9)
        end = date(2017, 8, 10)
        s = mws.DateRangeSlider(start=start, end=end,
            # Bokeh serializes as ms since epoch, if they get set as numbers (e.g.)
            # by client side update, this is the units they will be
            value=(convert_date_to_datetime(start), convert_date_to_datetime(end)))
        assert s.value_as_date == (start, end)

    def test_value_as_date_when_set_mixed(self) -> None:
        start = date(2017, 8, 9)
        end = date(2017, 8, 10)
        s = mws.DateRangeSlider(start=start, end=end,
                value=(start, convert_date_to_datetime(end)))
        assert s.value_as_date == (start, end)

        s = mws.DateRangeSlider(start=start, end=end,
                value=(convert_date_to_datetime(start), end))
        assert s.value_as_date == (start, end)


class TestDateSlider:
    def test_value_as_datetime_when_set_as_datetime(self) -> None:
        start = datetime(2017, 8, 9, 0, 0)
        end = datetime(2017, 8, 10, 0, 0)
        s = mws.DateSlider(start=start, end=end, value=start)
        assert s.value_as_datetime == start

    def test_value_as_datetime_when_set_as_timestamp(self) -> None:
        start = datetime(2017, 8, 9, 0, 0)
        end = datetime(2017, 8, 10, 0, 0)
        s = mws.DateSlider(start=start, end=end,
            # Bokeh serializes as ms since epoch, if they get set as numbers (e.g.)
            # by client side update, this is the units they will be
            value=convert_datetime_type(start))
        assert s.value_as_datetime == start

    def test_value_as_date_when_set_as_date(self) -> None:
        start = date(2017, 8, 9)
        end = date(2017, 8, 10)
        s = mws.DateSlider(start=start, end=end, value=end)
        assert s.value_as_date == end

    def test_value_as_date_when_set_as_timestamp(self) -> None:
        start = date(2017, 8, 9)
        end = date(2017, 8, 10)
        s = mws.DateSlider(start=start, end=end,
            # Bokeh serializes as ms since epoch, if they get set as numbers (e.g.)
            # by client side update, this is the units they will be
            value=convert_date_to_datetime(end))
        assert s.value_as_date == end


class TestRangeSlider:
    def test_rangeslider_equal_start_end_exception(self) -> None:
        start = 0
        end = 0
        with pytest.raises(ValueError):
            mws.RangeSlider(start=start, end=end)

    def test_rangeslider_equal_start_end_validation(self, caplog) -> None:
        start = 0
        end = 10
        s = mws.RangeSlider(start=start, end=end)
        #with caplog.at_level(logging.ERROR, logger='bokeh.core.validation.check'):
        with caplog.at_level(logging.ERROR):
            assert len(caplog.records) == 0
            s.end = 0
            check_integrity([s])
            assert len(caplog.records) == 1


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
