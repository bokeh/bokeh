#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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
from datetime import datetime, timedelta
from time import sleep

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    DatetimeRangeSlider,
    Plot,
    Range1d,
    Scatter,
)
from tests.support.plugins.project import BokehModelPage, BokehServerPage
from tests.support.util.selenium import (
    RECORD,
    drag_range_slider,
    find_elements_for,
    get_slider_bar_color,
    get_slider_title_text,
    get_slider_title_value,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

start = datetime(2022, 2, 1, 5, 4, 3)
end = datetime(2022, 3, 25, 12, 34, 56)
value = (start + timedelta(days=1), end - timedelta(days=1))


@pytest.mark.selenium
class Test_DatetimeRangeSlider:
    def test_display(self, bokeh_model_page: BokehModelPage) -> None:
        slider = DatetimeRangeSlider(start=start, end=end, value=value, width=300)

        page = bokeh_model_page(slider)

        children = find_elements_for(page.driver, slider, "div.bk-input-group > div")
        assert len(children) == 2

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page: BokehModelPage) -> None:
        slider = DatetimeRangeSlider(start=start, end=end, value=value, width=300)

        page = bokeh_model_page(slider)

        children = find_elements_for(page.driver, slider, "div.bk-input-group > div")
        assert len(children) == 2

        assert get_slider_title_text(page.driver, slider) == '02 Feb 2022 05:04:03 .. 24 Mar 2022 12:34:56'
        assert get_slider_title_value(page.driver, slider) == '02 Feb 2022 05:04:03 .. 24 Mar 2022 12:34:56'

        assert page.has_no_console_errors()

    def test_title_updates(self, bokeh_model_page: BokehModelPage) -> None:
        slider = DatetimeRangeSlider(start=start, end=end, value=value, width=300)

        page = bokeh_model_page(slider)

        assert get_slider_title_value(page.driver, slider) == '02 Feb 2022 05:04:03 .. 24 Mar 2022 12:34:56'

        drag_range_slider(page.driver, slider, "lower", 5)
        val = get_slider_title_value(page.driver, slider).split(" .. ")[0]
        assert val[:11] == "03 Feb 2022"

        drag_range_slider(page.driver, slider, "upper", -5)
        val = get_slider_title_value(page.driver, slider).split(" .. ")[1]
        assert val[:11] == "23 Mar 2022"

        assert page.has_no_console_errors()

    def test_displays_bar_color(self, bokeh_model_page: BokehModelPage) -> None:
        slider = DatetimeRangeSlider(start=start, end=end, value=value, width=300, bar_color="red")

        page = bokeh_model_page(slider)

        children = find_elements_for(page.driver, slider, "div.bk-input-group > div")
        assert len(children) == 2

        assert get_slider_bar_color(page.driver, slider) == "rgba(255, 0, 0, 1)"

        assert page.has_no_console_errors()

    def test_server_on_change_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        slider = DatetimeRangeSlider(start=start, end=end, value=value, width=300)

        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Scatter(x='x', y='y', size=20))
            plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))

            def cb(attr, old, new):
                source.data['val'] = [slider.value_as_datetime[0].isoformat(), slider.value_as_datetime[1].isoformat()]

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_range_slider(page.driver, slider, "lower", 5)

        page.eval_custom_action()
        results = page.results
        new = results['data']['val']
        assert new[0] > '2022-02-01'

        drag_range_slider(page.driver, slider, "upper", -5)

        page.eval_custom_action()
        results = page.results
        new = results['data']['val']
        assert new[1] < '2022-03-25'

    def test_server_bar_color_updates(self, bokeh_server_page: BokehServerPage) -> None:
        slider = DatetimeRangeSlider(start=start, end=end, value=value, width=300, bar_color="red")

        def modify_doc(doc):
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)

            def cb(attr, old, new):
                slider.bar_color = "rgba(255, 255, 0, 1)"

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_range_slider(page.driver, slider, "lower", 150)

        sleep(1) # noUiSlider does a transition that takes some time

        assert get_slider_bar_color(page.driver, slider) == "rgba(255, 255, 0, 1)"
