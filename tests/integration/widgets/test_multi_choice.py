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
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# Bokeh imports
from bokeh.layouts import row
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomJS,
    MultiChoice,
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

def mk_modify_doc(input_box: MultiChoice):
    def modify_doc(doc):
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
        plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y', size=20))
        plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))
        input_box.title = "title"
        input_box.options = ["100001", "12344556", "12344557", "3194567289", "209374209374"]
        input_box.value = ["12344556", "12344557"]
        def cb(attr, old, new):
            source.data['val'] = [old, new]
        input_box.on_change('value', cb)
        doc.add_root(row(input_box, plot))
    return modify_doc

@pytest.mark.selenium
class Test_MultiChoice:
    def test_displays_multi_choice(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = MultiChoice(options = ["100001", "12344556", "12344557", "3194567289", "209374209374"])
        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, "input")
        assert el.get_attribute('type') == "search"

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = MultiChoice(title="title", options = ["100001", "12344556", "12344557", "3194567289", "209374209374"])
        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, "label")
        assert el.text == "title"
        el = find_element_for(page.driver, text_input, "input")
        assert el.get_attribute('placeholder') == ""
        assert el.get_attribute('type') == "search"

        assert page.has_no_console_errors()

    def test_displays_menu(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = MultiChoice(title="title", options = ["100001", "12344556", "12344557", "3194567289", "209374209374"])
        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, ".choices__list--dropdown")
        assert 'is-active' not in el.get_attribute('class')

        # double click to highlight and overwrite old text
        inp = find_element_for(page.driver, text_input, "input")
        inp.click()
        assert 'is-active' in el.get_attribute('class')

        inp.send_keys(Keys.ENTER)

        selected = find_element_for(page.driver, text_input, ".choices__list--multiple")
        items = selected.find_elements(By.CSS_SELECTOR, "div")
        assert len(items) == 1

        item = find_element_for(page.driver, text_input, ".choices__list--multiple div.choices__item")
        assert '100001' == item.get_attribute('data-value')

        delete_button = find_element_for(page.driver, text_input, ".choices__item button")
        assert "Remove item: '100001'" == delete_button.get_attribute('aria-label')

        delete_button.click()

        selected = find_element_for(page.driver, text_input, ".choices__list--multiple")
        items = selected.find_elements(By.CSS_SELECTOR, "div")
        assert len(items) == 0

        assert page.has_no_console_errors()

    def test_server_on_change_round_trip_on_enter(self, bokeh_server_page: BokehServerPage) -> None:
        input_box = MultiChoice()
        page = bokeh_server_page(mk_modify_doc(input_box))

        inp = find_element_for(page.driver, input_box, "input")
        inp.click()

        inp.send_keys(Keys.ENTER)
        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == [['12344556', '12344557'], ['12344556', '12344557', '100001']]
