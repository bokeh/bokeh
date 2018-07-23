import bokeh.models.widgets.sliders as mws

from datetime import datetime
import logging
import pytest

from bokeh.util.serialization import convert_datetime_type
from bokeh.util.logconfig import basicConfig
from bokeh.core.validation.check import check_integrity

# needed for caplog tests to function
basicConfig()

def test_daterangeslider_value_as_datetime_when_set_as_datetime():
    start = datetime(2017, 8, 9, 0, 0)
    end = datetime(2017, 8, 10, 0, 0)
    s = mws.DateRangeSlider(start=start, end=end, value=(start, end))
    assert s.value_as_datetime == (start, end)

def test_daterangeslider_value_as_datetime_when_set_as_timestamp():
    start = datetime(2017, 8, 9, 0, 0)
    end = datetime(2017, 8, 10, 0, 0)
    s = mws.DateRangeSlider(start=start, end=end,
            # Bokeh serializes as ms since epoch, if they get set as numbers (e.g.)
            # by client side update, this is the units they will be
            value=(convert_datetime_type(start), convert_datetime_type(end)))
    assert s.value_as_datetime == (start, end)

def test_daterangeslider_value_as_datetime_when_set_mixed():
    start = datetime(2017, 8, 9, 0, 0)
    end = datetime(2017, 8, 10, 0, 0)
    s = mws.DateRangeSlider(start=start, end=end,
            value=(start, convert_datetime_type(end)))
    assert s.value_as_datetime == (start, end)

    s = mws.DateRangeSlider(start=start, end=end,
            value=(convert_datetime_type(start), end))
    assert s.value_as_datetime == (start, end)

def test_rangeslider_equal_start_end_exception():
    start = 0
    end = 0
    with pytest.raises(ValueError):
        mws.RangeSlider(start=start, end=end)

def test_rangeslider_equal_start_end_validation(caplog):
    start = 0
    end = 10
    s = mws.RangeSlider(start=start, end=end)
    #with caplog.at_level(logging.ERROR, logger='bokeh.core.validation.check'):
    with caplog.at_level(logging.ERROR):
        assert len(caplog.records) == 0
        s.end = 0
        check_integrity([s])
        assert len(caplog.records) == 1
