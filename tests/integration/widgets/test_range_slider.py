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
from time import sleep

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    Plot,
    Range1d,
    RangeSlider,
    Scatter,
)
from bokeh.models.formatters import BasicTickFormatter
from tests.support.plugins.project import BokehModelPage, BokehServerPage
from tests.support.util.selenium import (
    RECORD,
    Keys,
    drag_range_slider,
    find_element_for,
    find_elements_for,
    get_slider_bar_color,
    get_slider_title_text,
    get_slider_title_value,
    select_element_and_press_key,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)


@pytest.mark.selenium
class Test_RangeSlider:
    def test_display(self, bokeh_model_page: BokehModelPage) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 5), width=300)
        page = bokeh_model_page(slider)

        children = find_elements_for(page.driver, slider, "div.bk-input-group > div")
        assert len(children) == 2

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page: BokehModelPage) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 5), title="bar", width=300)
        page = bokeh_model_page(slider)

        children = find_elements_for(page.driver, slider, "div.bk-input-group > div")
        assert len(children) == 2

        assert get_slider_title_text(page.driver, slider) == "bar: 1 .. 5"
        assert get_slider_title_value(page.driver, slider) == "1 .. 5"

        assert page.has_no_console_errors()

    def test_displays_title_scientific(self, bokeh_model_page: BokehModelPage) -> None:
        slider = RangeSlider(start=0, end=10e-6, step=1e-6, value=(1e-6, 8e-6), title="bar",
            format=BasicTickFormatter(precision=2), width=300)
        page = bokeh_model_page(slider)

        children = find_elements_for(page.driver, slider, "div.bk-input-group > div")
        assert len(children) == 2

        t0 = get_slider_title_text(page.driver, slider)
        t1 = get_slider_title_value(page.driver, slider)

        assert t0 == "bar: 1.00e\u22126 .. 8.00e\u22126"
        assert t1 == "1.00e\u22126 .. 8.00e\u22126"

        assert page.has_no_console_errors()

    def test_title_updates(self, bokeh_model_page: BokehModelPage) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 9), title="bar", width=300)

        page = bokeh_model_page(slider)

        assert get_slider_title_value(page.driver, slider) == "1 .. 9"

        drag_range_slider(page.driver, slider, "lower", 50)
        value = get_slider_title_value(page.driver, slider).split()[0]
        assert float(value) > 1
        assert float(value) == int(value) # integral step size

        # don't go past upper handle
        drag_range_slider(page.driver, slider, "lower", 50)
        value = get_slider_title_value(page.driver, slider).split()[0]
        assert float(value) > 2

        drag_range_slider(page.driver, slider, "lower", -135)
        value = get_slider_title_value(page.driver, slider).split()[0]
        assert float(value) == 0

        assert page.has_no_console_errors()

    def test_keypress_event(self, bokeh_model_page: BokehModelPage) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 5), title="bar", width=300)
        page = bokeh_model_page(slider)

        handle_lower = find_element_for(page.driver, slider, ".noUi-handle-lower")
        handle_upper = find_element_for(page.driver, slider, ".noUi-handle-upper")

        select_element_and_press_key(page.driver, handle_lower, Keys.ARROW_RIGHT, press_number=1)
        assert get_slider_title_value(page.driver, slider) == "2 .. 5"
        select_element_and_press_key(page.driver, handle_lower, Keys.ARROW_LEFT, press_number=5)
        assert get_slider_title_value(page.driver, slider) == "0 .. 5"
        select_element_and_press_key(page.driver, handle_lower, Keys.ARROW_RIGHT, press_number=11)
        assert get_slider_title_value(page.driver, slider) == "5 .. 5"
        select_element_and_press_key(page.driver, handle_upper, Keys.ARROW_RIGHT, press_number=1)
        assert get_slider_title_value(page.driver, slider) == "5 .. 6"
        select_element_and_press_key(page.driver, handle_upper, Keys.ARROW_LEFT, press_number=2)
        assert get_slider_title_value(page.driver, slider) == "5 .. 5"
        select_element_and_press_key(page.driver, handle_upper, Keys.ARROW_RIGHT, press_number=6)
        assert get_slider_title_value(page.driver, slider) == "5 .. 10"

        assert page.has_no_console_errors()

    def test_displays_bar_color(self, bokeh_model_page: BokehModelPage) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 5), title="bar", width=300, bar_color="red")
        page = bokeh_model_page(slider)

        children = find_elements_for(page.driver, slider, "div.bk-input-group > div")
        assert len(children) == 2

        assert get_slider_bar_color(page.driver, slider) == "rgba(255, 0, 0, 1)"

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page: BokehModelPage) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 5), title="bar", width=300)
        slider.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(slider)

        drag_range_slider(page.driver, slider, "lower", 150)

        results = page.results
        assert float(results['value'][0]) > 1
        assert float(results['value'][1]) == 5

        drag_range_slider(page.driver, slider, "lower", 150)

        results = page.results
        assert float(results['value'][0]) > 1
        assert float(results['value'][1]) > 5

        assert page.has_no_console_errors()


    def test_server_on_change_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 9), title="bar", width=300)

        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Scatter(x='x', y='y', size=20))
            plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))

            def cb(attr, old, new):
                source.data['val'] = [old, new]

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_range_slider(page.driver, slider, "lower", 50)

        page.eval_custom_action()
        results = page.results
        old, new = results['data']['val']
        assert float(old[0]) == 1
        assert float(new[0]) > 1

        drag_range_slider(page.driver, slider, "lower", 50)

        page.eval_custom_action()
        results = page.results
        old, new = results['data']['val']
        assert float(new[0]) > 2

        drag_range_slider(page.driver, slider, "lower", -135)

        page.eval_custom_action()
        results = page.results
        old, new = results['data']['val']
        assert float(new[0]) == 0

        # XXX (bev) skip keypress part of test until it can be fixed
        # handle = find_element_for(page.driver, slider, ".noUi-handle-lower")
        # select_element_and_press_key(page.driver, handle, Keys.ARROW_RIGHT)

        # page.eval_custom_action()
        # results = page.results
        # old, new = results['data']['val']
        # assert float(new[0]) >= 1

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()

    def test_server_bar_color_updates(self, bokeh_server_page: BokehServerPage) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 5), title="bar", width=300)

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
