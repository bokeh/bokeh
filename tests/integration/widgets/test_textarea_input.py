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

# External imports
from selenium.webdriver.common.keys import Keys

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    Plot,
    Range1d,
    Scatter,
    TextAreaInput,
)
from tests.support.plugins.project import BokehModelPage, BokehServerPage
from tests.support.util.selenium import RECORD, enter_text_in_element, find_element_for

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

foo = []

def mk_modify_doc(text_input: TextAreaInput):
    def modify_doc(doc):
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
        plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Scatter(x='x', y='y', size=20))
        code = RECORD("data", "s.data")
        plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=code))
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

    def test_server_on_change_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        text_input = TextAreaInput(cols=20)
        page = bokeh_server_page(mk_modify_doc(text_input))

        el = find_element_for(page.driver, text_input, "textarea")
        enter_text_in_element(page.driver, el, "val1" + Keys.TAB)

        page.eval_custom_action()
        results = page.results
        assert results['data']['val'] == ["", "val1"]
