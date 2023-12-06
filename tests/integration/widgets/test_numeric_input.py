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

# Bokeh imports
from bokeh.application.handlers.function import ModifyDoc
from bokeh.layouts import column
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    NumericInput,
    Plot,
    Range1d,
    Scatter,
)
from tests.support.plugins.project import BokehModelPage, BokehServerPage, SinglePlotPage
from tests.support.util.selenium import RECORD, enter_text_in_element, find_element_for

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

def mk_modify_doc(num_input: NumericInput) -> tuple[ModifyDoc, Plot]:
    plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
    def modify_doc(doc):
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))

        plot.add_glyph(source, Scatter(x='x', y='y'))
        plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))

        def cb(attr, old, new):
            source.data['val'] = [old, new]

        num_input.on_change('value', cb)
        doc.add_root(column(num_input, plot))
        return doc
    return modify_doc, plot

@pytest.mark.selenium
class Test_NumericInput:

    def test_display_number_input(self, bokeh_model_page: BokehModelPage) -> None:
        num_input = NumericInput()
        page = bokeh_model_page(num_input)

        el = find_element_for(page.driver, num_input, "input")
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page: BokehModelPage) -> None:
        num_input = NumericInput(title="title")
        page = bokeh_model_page(num_input)

        el = find_element_for(page.driver, num_input, "label")
        assert el.text == "title"
        el = find_element_for(page.driver, num_input, "input")
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    def test_displays_placeholder(self, bokeh_model_page: BokehModelPage) -> None:
        num_input = NumericInput(placeholder="placeholder")
        page = bokeh_model_page(num_input)

        el = find_element_for(page.driver, num_input, "label")
        assert el.text == ""
        el = find_element_for(page.driver, num_input, "input")
        assert el.get_attribute('placeholder') == "placeholder"
        assert el.get_attribute('type') == "text"

    def test_server_on_change_no_round_trip_without_enter_or_click(self, bokeh_server_page: BokehServerPage) -> None:
        num_input = NumericInput(low=-1, high=100, value=4)
        modify_doc, _ = mk_modify_doc(num_input)
        page = bokeh_server_page(modify_doc)

        el = find_element_for(page.driver, num_input, "input")
        enter_text_in_element(page.driver, el, "pre", enter=False)  # not change event if enter is not pressed

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["a", "b"]

        assert page.has_no_console_errors()

    def test_server_on_change_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        num_input = NumericInput(low=-1, high=100, value=4)
        modify_doc, plot = mk_modify_doc(num_input)
        page = bokeh_server_page(modify_doc)

        el = find_element_for(page.driver, num_input, "input")
        enter_text_in_element(page.driver, el, "2")

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == [4, 42]

        # double click to highlight and overwrite old text
        enter_text_in_element(page.driver, el, "34", click=2)

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == [42, 34]

        # Check clicking outside input also triggers
        enter_text_in_element(page.driver, el, "56", click=2, enter=False)
        page.click_canvas_at_position(plot, 10, 10)

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == [34, 56]

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, single_plot_page: SinglePlotPage) -> None:
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Scatter(x='x', y='y', size=20))
        num_input = NumericInput()
        num_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = single_plot_page(column(num_input, plot))

        el = find_element_for(page.driver, num_input, "input")
        enter_text_in_element(page.driver, el, "10")

        results = page.results
        assert results['value'] == 10

        # double click to highlight and overwrite old text
        enter_text_in_element(page.driver, el, "20", click=2)

        results = page.results
        assert results['value'] == 20

        # Check clicking outside input also triggers
        enter_text_in_element(page.driver, el, "30", click=2, enter=False)
        page.click_canvas_at_position(plot, 10, 10)
        results = page.results

        assert results['value'] == 30

        assert page.has_no_console_errors()

    def test_low_high(self, single_plot_page: SinglePlotPage) -> None:
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Scatter(x='x', y='y', size=20))
        num_input = NumericInput(value=4, low=-1, high=10)
        num_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = single_plot_page(column(num_input, plot))

        el = find_element_for(page.driver, num_input, "input")
        assert el.get_attribute('value') == "4"

        enter_text_in_element(page.driver, el, "30", click=2)
        assert el.get_attribute('value') == "10"

        enter_text_in_element(page.driver, el, "-10", click=2)
        assert el.get_attribute('value') == "-1"

    def test_int_inputs(self, single_plot_page: SinglePlotPage) -> None:

        values_to_enter = ["0", "1", "-1", "+5",
                          "0.1", "-0.1", "+0.1", "-.1", "+.1",
                          "1e-6", "1.e5", "-1e+3", "-1.e-5",
                          "a"]

        expected_results = [0, 1, -1, 5, 1, -1, 1, -1, 1,
                            10, 10, -13, -15, None]

        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Scatter(x='x', y='y', size=20))
        num_input = NumericInput(high=10)
        num_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = single_plot_page(column(num_input, plot))
        el = find_element_for(page.driver, num_input, "input")

        for val, res in zip(values_to_enter, expected_results):
            el.clear()
            enter_text_in_element(page.driver, el, val)

            results = page.results
            assert results['value'] == res

    def test_float_inputs(self, single_plot_page: SinglePlotPage) -> None:

        values_to_enter = ["0", "1", "-1", "+5",
                          "0.1", "-0.1", "+0.1", "-.1", "+.1",
                          "1e-6", "1.e5", "-1e+3", "-1.e-5",
                          "a"]

        expected_results = [0, 1, -1, 5, 0.1, -0.1, 0.1, -0.1, 0.1,
                            1e-6, 10, -1e3, -1e-5, None]

        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Scatter(x='x', y='y', size=20))
        num_input = NumericInput(high=10, mode="float")
        num_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = single_plot_page(column(num_input, plot))
        el = find_element_for(page.driver, num_input, "input")

        for val, res in zip(values_to_enter, expected_results):
            el.clear()
            enter_text_in_element(page.driver, el, val)

            results = page.results
            assert results['value'] == res
