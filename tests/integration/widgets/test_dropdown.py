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
    Dropdown,
    Plot,
    Range1d,
)
from tests.support.plugins.project import BokehModelPage, BokehServerPage
from tests.support.util.selenium import RECORD, find_element_for

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

# XXX (bev) split dropdown (i.e. with default value) has serious problems

items = [("Item 1", "item_1_value"), ("Item 2", "item_2_value"), ("Item 3", "item_3_value")]


@pytest.mark.selenium
class Test_Dropdown:
    def test_displays_menu_items(self, bokeh_model_page: BokehModelPage) -> None:
        button = Dropdown(label="Dropdown button", menu=items)
        page = bokeh_model_page(button)

        button_el = find_element_for(page.driver, button, "button")
        assert button_el.text == "Dropdown button"
        button_el.click()

        menu = find_element_for(page.driver, button, ".bk-menu")
        assert menu.is_displayed()

    @pytest.mark.parametrize('typ', list(ButtonType))
    def test_displays_button_type(self, typ, bokeh_model_page: BokehModelPage) -> None:
        button = Dropdown(label="Dropdown button", menu=items, button_type=typ)
        page = bokeh_model_page(button)

        button_el = find_element_for(page.driver, button, "button")
        assert typ in button_el.get_attribute('class')

    def test_server_on_change_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        button = Dropdown(label="Dropdown button", menu=items)
        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))
            def cb(event):
                item = event.item
                if item == "item_1_value":
                    source.data = dict(x=[10, 20], y=[10, 10])
                elif item == "item_2_value":
                    source.data = dict(x=[100, 200], y=[100, 100])
                elif item == "item_3_value":
                    source.data = dict(x=[1000, 2000], y=[1000, 1000])
            button.on_event('menu_item_click', cb)
            doc.add_root(column(button, plot))

        page = bokeh_server_page(modify_doc)

        button_el = find_element_for(page.driver, button, "button")
        button_el.click()

        item = find_element_for(page.driver, button, ".bk-menu > *:nth-child(1)")
        item.click()

        page.eval_custom_action()

        results = page.results
        assert results == {'data': {'x': [10, 20], 'y': [10, 10]}}

        button_el = find_element_for(page.driver, button, "button")
        button_el.click()

        item = find_element_for(page.driver, button, ".bk-menu > *:nth-child(3)")
        item.click()

        page.eval_custom_action()

        results = page.results
        assert results == {'data': {'x': [1000, 2000], 'y': [1000, 1000]}}

        button_el = find_element_for(page.driver, button, "button")
        button_el.click()

        item = find_element_for(page.driver, button, ".bk-menu > *:nth-child(2)")
        item.click()

        page.eval_custom_action()

        results = page.results
        assert results == {'data': {'x': [100, 200], 'y': [100, 100]}}

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page: BokehModelPage) -> None:
        button = Dropdown(label="Dropdown button", menu=items)
        button.js_on_event('menu_item_click', CustomJS(code=RECORD("value", "this.item")))

        page = bokeh_model_page(button)

        button_el = find_element_for(page.driver, button, "button")
        button_el.click()

        item = find_element_for(page.driver, button, ".bk-menu > *:nth-child(1)")
        item.click()

        results = page.results
        assert results == {'value': "item_1_value"}

        button_el = find_element_for(page.driver, button, "button")
        button_el.click()

        item = find_element_for(page.driver, button, ".bk-menu > *:nth-child(3)")
        item.click()

        results = page.results
        assert results == {'value': "item_3_value"}

        button_el = find_element_for(page.driver, button, "button")
        button_el.click()

        item = find_element_for(page.driver, button, ".bk-menu > *:nth-child(2)")
        item.click()

        results = page.results
        assert results == {'value': "item_2_value"}

        assert page.has_no_console_errors()
