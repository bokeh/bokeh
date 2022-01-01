#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc. All rights reserved.
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

# External imports
from flaky import flaky
from selenium.webdriver.common.keys import Keys

# Bokeh imports
from bokeh._testing.plugins.project import BokehModelPage, BokehServerPage
from bokeh._testing.util.selenium import RECORD, enter_text_in_element, find_element_for
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
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

foo = []

def mk_modify_doc(text_input: TextAreaInput):
    def modify_doc(doc):
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
        plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y', size=20))
        code = RECORD("data", "s.data")
        plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=code)))
        def cb(attr, old, new):
            foo.append((old, new))
            source.data['val'] = [old, new]
        text_input.on_change('value', cb)
        doc.add_root(column(text_input, plot))
    return modify_doc

@pytest.mark.selenium
class Test_TextInput:
    def test_displays_text_input(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = TextAreaInput()
        page = bokeh_model_page(text_input)
        el = find_element_for(page.driver, text_input, "textarea")
        assert el.tag_name == 'textarea'
        assert page.has_no_console_errors()

    def test_displays_placeholder(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = TextAreaInput(placeholder="placeholder")
        page = bokeh_model_page(text_input)
        el = find_element_for(page.driver, text_input, "textarea")
        assert el.get_attribute('placeholder') == "placeholder"
        assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_on_change_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        text_input = TextAreaInput(cols=20)
        page = bokeh_server_page(mk_modify_doc(text_input))

        el = find_element_for(page.driver, text_input, "textarea")
        enter_text_in_element(page.driver, el, "val1" + Keys.TAB)

        page.click_custom_action()
        results = page.results
        assert results['data']['val'] == ["", "val1"]
