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

# External imports
from flaky import flaky

# Bokeh imports
from bokeh._testing.util.selenium import RECORD, enter_text_in_element
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    NumericInput,
    Plot,
    Range1d,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)


def modify_doc(doc):
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
    plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)

    plot.add_glyph(source, Circle(x='x', y='y'))
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
    num_input = NumericInput(low=-1, high=100, value=4, css_classes=["foo"])

    def cb(attr, old, new):
        source.data['val'] = [old, new]

    num_input.on_change('value', cb)
    doc.add_root(column(num_input, plot))
    return doc

@pytest.mark.selenium
class Test_NumericInput(object):

    def test_display_number_input(self, bokeh_model_page) -> None:
        num_input = NumericInput(css_classes=["foo"])

        page = bokeh_model_page(num_input)

        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page) -> None:
        num_input = NumericInput(title="title", css_classes=["foo"])

        page = bokeh_model_page(num_input)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == "title"
        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    def test_displays_placeholder(self, bokeh_model_page) -> None:
        num_input = NumericInput(placeholder="placeholder", css_classes=["foo"])

        page = bokeh_model_page(num_input)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == ""
        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('placeholder') == "placeholder"
        assert el.get_attribute('type') == "text"

    @flaky(max_runs=10)
    def test_server_on_change_no_round_trip_without_enter_or_click(self, bokeh_server_page) -> None:
        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "pre", enter=False)  # not change event if enter is not pressed

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["a", "b"]

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    #@flaky(max_runs=10)
    # TODO (bev) Fix up after GH CI switch
    @pytest.mark.skip
    @flaky(max_runs=10)
    def test_server_on_change_round_trip(self, bokeh_server_page) -> None:
        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "2")

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == [4, 42]

        # double click to highlight and overwrite old text
        enter_text_in_element(page.driver, el, "34", click=2)

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == [42, 34]

        # Check clicking outside input also triggers
        enter_text_in_element(page.driver, el, 56, click=2, enter=False)
        page.click_canvas_at_position(10, 10)

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == [34, 56]

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_js_on_change_executes(self, single_plot_page) -> None:
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y', size=20))
        num_input = NumericInput(css_classes=['foo'])
        num_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = single_plot_page(column(num_input, plot))

        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "10")

        results = page.results
        assert results['value'] == 10

        # double click to highlight and overwrite old text
        enter_text_in_element(page.driver, el, "20", click=2)

        results = page.results
        assert results['value'] == 20

        # Check clicking outside input also triggers
        enter_text_in_element(page.driver, el, "30", click=2, enter=False)
        page.click_canvas_at_position(10, 10)
        results = page.results

        assert results['value'] == 30

        assert page.has_no_console_errors()

    def test_low_high(self, single_plot_page) -> None:
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y', size=20))
        num_input = NumericInput(value=4, low=-1, high=10, css_classes=['foo'])
        num_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = single_plot_page(column(num_input, plot))

        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('value') == "4"

        enter_text_in_element(page.driver, el, "30", click=2)
        assert el.get_attribute('value') == "10"

        enter_text_in_element(page.driver, el, "-10", click=2)
        assert el.get_attribute('value') == "-1"

    def test_int_inputs(self, single_plot_page) -> None:

        values_to_enter = ["0", "1", "-1", "+5",
                          "0.1", "-0.1", "+0.1", "-.1", "+.1",
                          "1e-6", "1.e5", "-1e+3", "-1.e-5",
                          "a"]

        expected_results = [0, 1, -1, 5, 1, -1, 1, -1, 1,
                            10, 10, -13, -15, None]

        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y', size=20))
        num_input = NumericInput(css_classes=['foo'], high=10)
        num_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = single_plot_page(column(num_input, plot))
        el = page.driver.find_element_by_css_selector('.foo input')

        for val, res in zip(values_to_enter, expected_results):
            el.clear()
            enter_text_in_element(page.driver, el, val)

            results = page.results
            assert results['value'] == res

    def test_float_inputs(self, single_plot_page) -> None:

        values_to_enter = ["0", "1", "-1", "+5",
                          "0.1", "-0.1", "+0.1", "-.1", "+.1",
                          "1e-6", "1.e5", "-1e+3", "-1.e-5",
                          "a"]

        expected_results = [0, 1, -1, 5, 0.1, -0.1, 0.1, -0.1, 0.1,
                            1e-6, 10, -1e3, -1e-5, None]

        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y', size=20))
        num_input = NumericInput(css_classes=['foo'], high=10, mode="float")
        num_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = single_plot_page(column(num_input, plot))
        el = page.driver.find_element_by_css_selector('.foo input')

        for val, res in zip(values_to_enter, expected_results):
            el.clear()
            enter_text_in_element(page.driver, el, val)

            results = page.results
            assert results['value'] == res
