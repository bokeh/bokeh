import bokeh.models.widgets.sliders as mws

from datetime import datetime

from bokeh.util.serialization import convert_datetime_type

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
