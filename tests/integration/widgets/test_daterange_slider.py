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
from datetime import date, datetime, timedelta
from time import sleep

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    DateRangeSlider,
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

start = date(2017, 8, 3)
end = date(2017, 8, 10)
value = (start + timedelta(days=1), end - timedelta(days=1))


@pytest.mark.selenium
class Test_DateRangeSlider:
    def test_display(self, bokeh_model_page: BokehModelPage) -> None:
        slider = DateRangeSlider(start=start, end=end, value=value, width=300)

        page = bokeh_model_page(slider)

        children = find_elements_for(page.driver, slider, "div.bk-input-group > div")
        assert len(children) == 2

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page: BokehModelPage) -> None:
        slider = DateRangeSlider(start=start, end=end, value=value, width=300)

        page = bokeh_model_page(slider)

        children = find_elements_for(page.driver, slider, "div.bk-input-group > div")
        assert len(children) == 2

        assert get_slider_title_text(page.driver, slider) == '04 Aug 2017 .. 09 Aug 2017'
        assert get_slider_title_value(page.driver, slider) == '04 Aug 2017 .. 09 Aug 2017'

        assert page.has_no_console_errors()


    def test_title_updates(self, bokeh_model_page: BokehModelPage) -> None:
        slider = DateRangeSlider(start=start, end=end, value=value, width=300)

        page = bokeh_model_page(slider)

        assert get_slider_title_value(page.driver, slider) == "04 Aug 2017 .. 09 Aug 2017"

        drag_range_slider(page.driver, slider, "lower", 50)
        val = get_slider_title_value(page.driver, slider).split(" .. ")[0]
        assert val > "04 Aug 2017"

        drag_range_slider(page.driver, slider, "lower", -70)
        val = get_slider_title_value(page.driver, slider).split(" .. ")[0]
        assert val == "03 Aug 2017"

        assert page.has_no_console_errors()

    def test_displays_bar_color(self, bokeh_model_page: BokehModelPage) -> None:
        slider = DateRangeSlider(start=start, end=end, value=value, width=300, bar_color="red")

        page = bokeh_model_page(slider)

        children = find_elements_for(page.driver, slider, "div.bk-input-group > div")
        assert len(children) == 2

        assert get_slider_bar_color(page.driver, slider) == "rgba(255, 0, 0, 1)"

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page: BokehModelPage) -> None:
        slider = DateRangeSlider(start=start, end=end, value=value, width=300)
        slider.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(slider)

        drag_range_slider(page.driver, slider, "lower", 50)

        results = page.results
        assert datetime.fromtimestamp(results['value'][0]/1000) > datetime(*date.fromisoformat("2017-08-04").timetuple()[:3])

        drag_range_slider(page.driver, slider, "upper", -70)
        assert datetime.fromtimestamp(results['value'][1]/1000) < datetime(*date.fromisoformat("2017-08-09").timetuple()[:3])

        assert page.has_no_console_errors()

    def test_server_on_change_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        slider = DateRangeSlider(start=start, end=end, value=value, width=300)

        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Scatter(x='x', y='y', size=20))
            plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))

            def cb(attr, old, new):
                source.data['val'] = [slider.value_as_date[0].isoformat(), slider.value_as_date[1].isoformat()]

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_range_slider(page.driver, slider, "lower", 50)

        page.eval_custom_action()
        results = page.results
        new = results['data']['val']
        assert new[0] > '2017-08-04'

        drag_range_slider(page.driver, slider, "upper", -50)


        page.eval_custom_action()
        results = page.results
        new = results['data']['val']
        assert new[1] < '2017-08-09'

#         # XXX (bev) skip keypress part of test until it can be fixed
#         # handle = find_element_for(page.driver, slider, ".noUi-handle-lower")
#         # select_element_and_press_key(page.driver, handle, Keys.ARROW_RIGHT)

#         # page.eval_custom_action()
#         # results = page.results
#         # old, new = results['data']['val']
#         # assert float(new[0]) >= 1

#         # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
#         # assert page.has_no_console_errors()

    def test_server_bar_color_updates(self, bokeh_server_page: BokehServerPage) -> None:
        slider = DateRangeSlider(start=start, end=end, value=value, width=300, bar_color="red")

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

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()
