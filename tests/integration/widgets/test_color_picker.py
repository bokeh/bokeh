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
from bokeh._testing.util.selenium import RECORD
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColorPicker,
    ColumnDataSource,
    CustomAction,
    CustomJS,
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
    colorpicker = ColorPicker(color='red', css_classes=["foo"])

    def cb(attr, old, new):
        source.data['val'] = [old.lower(), new.lower()]  # ensure lowercase of hexa strings

    colorpicker.on_change('color', cb)
    doc.add_root(column(colorpicker, plot))
    return doc


def enter_value_in_color_picker(driver, el, color):
    driver.execute_script("arguments[0].value = '%s'" % color, el)
    driver.execute_script("arguments[0].dispatchEvent(new Event('change'))", el)


@pytest.mark.selenium
class Test_ColorPicker:
    def test_display_color_input(self, bokeh_model_page) -> None:
        colorpicker = ColorPicker(css_classes=["foo"])

        page = bokeh_model_page(colorpicker)

        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('type') == "color"

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page) -> None:
        colorpicker = ColorPicker(css_classes=["foo"], title="title")

        page = bokeh_model_page(colorpicker)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == "title"

        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('type') == "color"

        assert page.has_no_console_errors()

    def test_input_value(self, bokeh_model_page) -> None:
        colorpicker = ColorPicker(color='red', css_classes=["foo"])

        page = bokeh_model_page(colorpicker)

        el = page.driver.find_element_by_css_selector('.foo input')

        assert el.get_attribute('value') == '#ff0000'

        assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_on_change_round_trip(self, bokeh_server_page) -> None:
        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_css_selector('.foo input')

        # new value
        enter_value_in_color_picker(page.driver, el, '#0000ff')
        page.click_custom_action()
        results = page.results
        assert results['data']['val'] == ['#ff0000', '#0000ff']

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        # assert page.has_no_console_errors()
