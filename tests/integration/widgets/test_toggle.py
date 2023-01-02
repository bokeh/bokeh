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
from bokeh.core.enums import ButtonType
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomJS,
    Plot,
    Range1d,
    Toggle,
)
from tests.support.plugins.project import BokehModelPage, BokehServerPage
from tests.support.util.selenium import RECORD, find_element_for

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)


@pytest.mark.selenium
class Test_Toggle:
    def test_displays_label(self, bokeh_model_page: BokehModelPage) -> None:
        button = Toggle(label="label")

        page = bokeh_model_page(button)

        button = find_element_for(page.driver, button, ".bk-btn")
        assert button.text == "label"

    @pytest.mark.parametrize('typ', list(ButtonType))
    def test_displays_button_type(self, typ, bokeh_model_page: BokehModelPage) -> None:
        button = Toggle(button_type=typ)

        page = bokeh_model_page(button)

        button = find_element_for(page.driver, button, ".bk-btn")
        assert typ in button.get_attribute('class')

    def test_server_on_click_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        button = Toggle()
        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))
            def cb(event):
                if button.active:
                    source.data=dict(x=[10, 20], y=[10, 10])
                else:
                    source.data=dict(x=[100, 200], y=[100, 100])
            button.on_event('button_click', cb)
            doc.add_root(column(button, plot))

        page = bokeh_server_page(modify_doc)

        button_el = find_element_for(page.driver, button, ".bk-btn")
        button_el.click()

        page.eval_custom_action()

        results = page.results
        assert results == {'data': {'x': [10, 20], 'y': [10, 10]}}

        button_el = find_element_for(page.driver, button, ".bk-btn")
        button_el.click()

        page.eval_custom_action()

        results = page.results
        assert results == {'data': {'x': [100, 200], 'y': [100, 100]}}

        button_el = find_element_for(page.driver, button, ".bk-btn")
        button_el.click()

        page.eval_custom_action()

        results = page.results
        assert results == {'data': {'x': [10, 20], 'y': [10, 10]}}

        assert page.has_no_console_errors()

    # XXX (bev) Toggle does not register to process ButtonClick events

    def test_js_on_click_executes(self, bokeh_model_page: BokehModelPage) -> None:
        button = Toggle()
        button.js_on_event('button_click', CustomJS(code=RECORD("value", "cb_obj.origin.active")))

        page = bokeh_model_page(button)

        button_el = find_element_for(page.driver, button, ".bk-btn")
        button_el.click()

        results = page.results
        assert results == {'value': True}

        button_el = find_element_for(page.driver, button, ".bk-btn")
        button_el.click()

        results = page.results
        assert results == {'value': False}

        button_el = find_element_for(page.driver, button, ".bk-btn")
        button_el.click()

        results = page.results
        assert results == {'value': True}

        assert page.has_no_console_errors()
