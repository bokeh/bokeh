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

# External imports
from flaky import flaky
from selenium.webdriver.common.keys import Keys

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
    TextAreaInput,
)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------




#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)


foo = []


def modify_doc(doc):
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
    plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
    plot.add_glyph(source, Circle(x='x', y='y', size=20))
    code = RECORD("data", "s.data")
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=code)))
    text_input = TextAreaInput(cols=20, css_classes=["foo"])
    def cb(attr, old, new):
        foo.append((old, new))
        source.data['val'] = [old, new]
    text_input.on_change('value', cb)
    doc.add_root(column(text_input, plot))


@pytest.mark.selenium
class Test_TextInput:
    def test_displays_text_input(self, bokeh_model_page) -> None:
        text_input = TextAreaInput(css_classes=["foo"])
        page = bokeh_model_page(text_input)
        input_div = page.driver.find_element_by_class_name('foo')
        el = input_div.find_element_by_tag_name("textarea")
        assert el.tag_name == 'textarea'
        assert page.has_no_console_errors()

    def test_displays_placeholder(self, bokeh_model_page) -> None:
        text_input = TextAreaInput(placeholder="placeholder", css_classes=["foo"])
        page = bokeh_model_page(text_input)
        input_div = page.driver.find_element_by_class_name('foo')
        el = input_div.find_element_by_tag_name("textarea")
        assert el.get_attribute('placeholder') == "placeholder"
        assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_on_change_round_trip(self, bokeh_server_page) -> None:
        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_class_name('foo')

        enter_text_in_element(page.driver, el, "val1" + Keys.TAB)

        page.click_custom_action()
        results = page.results
        assert results['data']['val'] == ["", "val1"]
