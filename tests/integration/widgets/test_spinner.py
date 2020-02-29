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
from bokeh._testing.util.selenium import RECORD, ActionChains, Keys
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    Plot,
    Range1d,
    Spinner,
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
    spinner = Spinner(low=-1, high=10, step=0.1, value=4, css_classes=["foo"])

    def cb(attr, old, new):
        source.data['val'] = [old, new]

    spinner.on_change('value', cb)
    doc.add_root(column(spinner, plot))
    return doc


def enter_value_in_spinner(driver, el, value, del_prev=True):
    if del_prev:
        el.clear()
    actions = ActionChains(driver)
    actions.move_to_element(el)
    actions.click()
    actions.send_keys(str(value))
    actions.send_keys(Keys.ENTER)
    actions.perform()


@pytest.mark.selenium
class Test_Spinner(object):

    def test_display_number_input(self, bokeh_model_page) -> None:
        spinner = Spinner(css_classes=["foo"])

        page = bokeh_model_page(spinner)

        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('type') == "number"

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page) -> None:
        spinner = Spinner(title="title", css_classes=["foo"])

        page = bokeh_model_page(spinner)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == "title"
        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('type') == "number"

        assert page.has_no_console_errors()

    def test_input_value_min_max_step(self, bokeh_model_page) -> None:
        spinner = Spinner(value=1, low=0, high=10, step=1, css_classes=["foo"])

        page = bokeh_model_page(spinner)

        el = page.driver.find_element_by_css_selector('.foo input')

        assert el.get_attribute('value') == '1'
        assert el.get_attribute('step') == '1'
        assert el.get_attribute('max') == '10'
        assert el.get_attribute('min') == '0'

        assert page.has_no_console_errors()

    def test_input_smallest_step(self, bokeh_model_page) -> None:
        spinner = Spinner(value=0, low=0, high=1, step=1e-16, css_classes=["foo"])
        spinner.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(spinner)

        el = page.driver.find_element_by_css_selector('.foo input')

        enter_value_in_spinner(page.driver, el, 1e-16)
        results = page.results
        assert float(results['value']) == 1e-16

        enter_value_in_spinner(page.driver, el, 0.43654644333534)
        results = page.results
        assert float(results['value']) == 0.43654644333534

        assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_on_change_round_trip(self, bokeh_server_page) -> None:
        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_css_selector('.foo input')

        # same value
        enter_value_in_spinner(page.driver, el, 4)
        page.click_custom_action()
        results = page.results
        assert results['data']['val'] == ["a", "b"]

        # new valid value
        enter_value_in_spinner(page.driver, el, 5)
        page.click_custom_action()
        results = page.results
        assert results['data']['val'] == [4, 5]

        # new overflow value
        enter_value_in_spinner(page.driver, el, 11)
        page.click_custom_action()
        results = page.results
        assert results['data']['val'] == [5, 10]

        # new underflow value
        enter_value_in_spinner(page.driver, el, -2)
        page.click_custom_action()
        results = page.results
        assert results['data']['val'] == [10, -1]

        # new decimal value
        enter_value_in_spinner(page.driver, el, 5.1)
        page.click_custom_action()
        results = page.results
        assert results['data']['val'] == [-1, 5.1]

        # new decimal value test rounding
        enter_value_in_spinner(page.driver, el, 5.19)
        page.click_custom_action()
        results = page.results
        assert results['data']['val'] == [5.1, 5.2]

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()
