#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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
from time import sleep

# External imports
from flaky import flaky

# Bokeh imports
from bokeh._testing.util.selenium import (
    RECORD,
    Keys,
    drag_range_slider,
    get_slider_bar_color,
    get_slider_title_text,
    get_slider_title_value,
    select_element_and_press_key,
)
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    Plot,
    Range1d,
    RangeSlider,
)
from bokeh.models.formatters import BasicTickFormatter

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)


@pytest.mark.selenium
class Test_RangeSlider:
    def test_display(self, bokeh_model_page) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 5), css_classes=["foo"], width=300)

        page = bokeh_model_page(slider)

        el = page.driver.find_element_by_css_selector('.foo')
        children = el.find_elements_by_css_selector('div.bk-input-group > div')
        assert len(children) == 2

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 5), title="bar", css_classes=["foo"], width=300)

        page = bokeh_model_page(slider)

        el = page.driver.find_element_by_css_selector('.foo')
        assert len(el.find_elements_by_css_selector('div.bk-input-group > div')) == 2

        assert get_slider_title_text(page.driver, ".foo") == "bar: 1 .. 5"
        assert get_slider_title_value(page.driver, ".foo") == "1 .. 5"

        assert page.has_no_console_errors()

    def test_displays_title_scientific(self, bokeh_model_page) -> None:
        slider = RangeSlider(start=0, end=10e-6, step=1e-6, value=(1e-6, 8e-6), title="bar",
            format=BasicTickFormatter(precision=2), css_classes=["foo"], width=300)

        page = bokeh_model_page(slider)

        el = page.driver.find_element_by_css_selector('.foo')
        assert len(el.find_elements_by_css_selector('div.bk-input-group > div')) == 2

        assert get_slider_title_text(page.driver, ".foo") == "bar: 1.00e-6 .. 8.00e-6"
        assert get_slider_title_value(page.driver, ".foo") == "1.00e-6 .. 8.00e-6"

        assert page.has_no_console_errors()

    def test_title_updates(self, bokeh_model_page) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 9), title="bar", css_classes=["foo"], width=300)

        page = bokeh_model_page(slider)

        assert get_slider_title_value(page.driver, ".foo") == "1 .. 9"

        drag_range_slider(page.driver, ".foo", "lower", 50)
        value = get_slider_title_value(page.driver, ".foo").split()[0]
        assert float(value) > 1
        assert float(value) == int(value) # integral step size

        # don't go past upper handle
        drag_range_slider(page.driver, ".foo", "lower", 50)
        value = get_slider_title_value(page.driver, ".foo").split()[0]
        assert float(value) > 2

        drag_range_slider(page.driver, ".foo", "lower", -135)
        value = get_slider_title_value(page.driver, ".foo").split()[0]
        assert float(value) == 0

        assert page.has_no_console_errors()

    @pytest.mark.skip
    def test_keypress_event(self, bokeh_model_page) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 5), title="bar", css_classes=["foo"], width=300)
        page = bokeh_model_page(slider)
        el = page.driver.find_element_by_css_selector('.foo')
        handle_lower = el.find_element_by_css_selector('.noUi-handle-lower')
        handle_upper = el.find_element_by_css_selector('.noUi-handle-upper')
        select_element_and_press_key(page.driver, handle_lower, Keys.ARROW_RIGHT, press_number=1)
        assert get_slider_title_value(page.driver, ".foo") == "2 .. 5"
        select_element_and_press_key(page.driver, handle_lower, Keys.ARROW_LEFT, press_number=5)
        assert get_slider_title_value(page.driver, ".foo") == "0 .. 5"
        select_element_and_press_key(page.driver, handle_lower, Keys.ARROW_RIGHT, press_number=11)
        assert get_slider_title_value(page.driver, ".foo") == "5 .. 5"
        select_element_and_press_key(page.driver, handle_upper, Keys.ARROW_RIGHT, press_number=1)
        assert get_slider_title_value(page.driver, ".foo") == "5 .. 6"
        select_element_and_press_key(page.driver, handle_upper, Keys.ARROW_LEFT, press_number=2)
        assert get_slider_title_value(page.driver, ".foo") == "5 .. 5"
        select_element_and_press_key(page.driver, handle_upper, Keys.ARROW_RIGHT, press_number=6)
        assert get_slider_title_value(page.driver, ".foo") == "5 .. 10"

        assert page.has_no_console_errors()

    def test_displays_bar_color(self, bokeh_model_page) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 5), title="bar", css_classes=["foo"], width=300, bar_color="red")

        page = bokeh_model_page(slider)

        el = page.driver.find_element_by_css_selector('.foo')
        assert len(el.find_elements_by_css_selector('div.bk-input-group > div')) == 2

        assert get_slider_bar_color(page.driver, ".foo") == "rgba(255, 0, 0, 1)"

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page) -> None:
        slider = RangeSlider(start=0, end=10, value=(1, 5), title="bar", css_classes=["foo"], width=300)
        slider.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(slider)

        drag_range_slider(page.driver, ".foo", "lower", 150)

        results = page.results
        assert float(results['value'][0]) > 1
        assert float(results['value'][1]) == 5

        drag_range_slider(page.driver, ".foo", "lower", 150)

        results = page.results
        assert float(results['value'][0]) > 1
        assert float(results['value'][1]) > 5

        assert page.has_no_console_errors()


    @flaky(max_runs=10)
    def test_server_on_change_round_trip(self, bokeh_server_page) -> None:

        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            slider = RangeSlider(start=0, end=10, value=(1, 9), title="bar", css_classes=["foo"], width=300)

            def cb(attr, old, new):
                source.data['val'] = [old, new]

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_range_slider(page.driver, ".foo", "lower", 50)

        page.click_custom_action()
        results = page.results
        old, new = results['data']['val']
        assert float(old[0]) == 1
        assert float(new[0]) > 1

        drag_range_slider(page.driver, ".foo", "lower", 50)

        page.click_custom_action()
        results = page.results
        old, new = results['data']['val']
        assert float(new[0]) > 2

        drag_range_slider(page.driver, ".foo", "lower", -135)

        page.click_custom_action()
        results = page.results
        old, new = results['data']['val']
        assert float(new[0]) == 0

        # XXX (bev) skip keypress part of test until it can be fixed
        # el = page.driver.find_element_by_css_selector('.foo')
        # handle = el.find_element_by_css_selector('.noUi-handle-lower')
        # select_element_and_press_key(page.driver, handle, Keys.ARROW_RIGHT)

        # page.click_custom_action()
        # results = page.results
        # old, new = results['data']['val']
        # assert float(new[0]) >= 1

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_bar_color_updates(self, bokeh_server_page) -> None:

        def modify_doc(doc):
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            slider = RangeSlider(start=0, end=10, value=(1, 5), title="bar", css_classes=["foo"], width=300)

            def cb(attr, old, new):
                slider.bar_color = "rgba(255, 255, 0, 1)"

            slider.on_change('value', cb)
            doc.add_root(column(slider, plot))

        page = bokeh_server_page(modify_doc)

        drag_range_slider(page.driver, ".foo", "lower", 150)

        sleep(1) # noUiSlider does a transition that takes some time

        assert get_slider_bar_color(page.driver, ".foo") == "rgba(255, 255, 0, 1)"

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()
