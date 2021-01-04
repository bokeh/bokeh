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
    Plot,
    Range1d,
    TextInput,
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
    plot.add_glyph(source, Circle(x='x', y='y', size=20))
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
    text_input = TextInput(css_classes=["foo"])
    def cb(attr, old, new):
        source.data['val'] = [old, new]
    text_input.on_change('value', cb)
    doc.add_root(column(text_input, plot))


@pytest.mark.selenium
class Test_TextInput:
    def test_displays_text_input(self, bokeh_model_page) -> None:
        text_input = TextInput(css_classes=["foo"])

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page) -> None:
        text_input = TextInput(title="title", css_classes=["foo"])

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == "title"
        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('placeholder') == ""
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    def test_displays_placeholder(self, bokeh_model_page) -> None:
        text_input = TextInput(placeholder="placeholder", css_classes=["foo"])

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == ""
        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('placeholder') == "placeholder"
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

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
        enter_text_in_element(page.driver, el, "val1")

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["", "val1"]

        # double click to highlight and overwrite old text
        enter_text_in_element(page.driver, el, "val2", click=2)

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["val1", "val2"]

        # Check clicking outside input also triggers
        enter_text_in_element(page.driver, el, "val3", click=2, enter=False)
        page.click_canvas_at_position(10, 10)

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["val2", "val3"]

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_js_on_change_executes(self, single_plot_page) -> None:
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y', size=20))
        text_input = TextInput(css_classes=['foo'])
        text_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = single_plot_page(column(text_input, plot))

        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "val1")

        results = page.results
        assert results['value'] == 'val1'

        # double click to highlight and overwrite old text
        enter_text_in_element(page.driver, el, "val2", click=2)

        results = page.results
        assert results['value'] == 'val2'

        # Check clicking outside input also triggers
        enter_text_in_element(page.driver, el, "val3", click=2, enter=False)
        page.click_canvas_at_position(10, 10)
        results = page.results

        assert results['value'] == 'val3'

        assert page.has_no_console_errors()
