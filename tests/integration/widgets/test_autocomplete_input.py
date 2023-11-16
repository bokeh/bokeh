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
from bokeh.application.handlers.function import ModifyDoc
from bokeh.layouts import column
from bokeh.models import (
    AutocompleteInput,
    ColumnDataSource,
    CustomJS,
    Plot,
    Range1d,
    Scatter,
)
from tests.support.plugins.project import BokehModelPage, BokehServerPage
from tests.support.util.selenium import (
    RECORD,
    enter_text_in_element,
    find_element_for,
    hover_element,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

def mk_modify_doc(input_box: AutocompleteInput) -> tuple[ModifyDoc, Plot]:
    plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
    def modify_doc(doc):
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
        plot.add_glyph(source, Scatter(x='x', y='y', size=20))
        plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))
        input_box.title = "title"
        input_box.value = "400"
        input_box.completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"]
        def cb(attr, old, new):
            source.data['val'] = [old, new]
        input_box.on_change('value', cb)
        doc.add_root(column(input_box, plot))
    return modify_doc, plot

@pytest.mark.selenium
class Test_AutocompleteInput:
    def test_displays_text_input(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = AutocompleteInput(completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, "input")
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = AutocompleteInput(title="title", completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, "label")
        assert el.text == "title"
        el = find_element_for(page.driver, text_input, "input")
        assert el.get_attribute('placeholder') == ""
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    def test_displays_menu(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = AutocompleteInput(title="title", completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' in el.get_attribute('style')

        # double click to highlight and overwrite old text
        el = find_element_for(page.driver, text_input, "input")
        enter_text_in_element(page.driver, el, "100", click=2, enter=False)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 1
        assert items[0].text == "100001"
        assert "bk-active" in items[0].get_attribute('class')

        el = find_element_for(page.driver, text_input, "input")
        enter_text_in_element(page.driver, el, "123", click=2, enter=False)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" in items[0].get_attribute('class')
        assert "bk-active" not in items[1].get_attribute('class')

        enter_text_in_element(page.driver, el, Keys.DOWN, click=0, enter=False)
        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" not in items[0].get_attribute('class')
        assert "bk-active" in items[1].get_attribute('class')

        assert page.has_no_console_errors()

    def test_min_characters(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = AutocompleteInput(title="title",
                                       completions = ["100001", "12344556", "12344557", "3194567289", "209374209374", "aaaaaa", "aaabbb", "AAAaAA", "AAABbB"],
                                       min_characters=1)

        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' in el.get_attribute('style')

        # double click to highlight and overwrite old text
        el = find_element_for(page.driver, text_input, "input")
        enter_text_in_element(page.driver, el, "1", click=2, enter=False)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 3
        assert items[0].text == "100001"
        assert items[1].text == "12344556"
        assert items[2].text == "12344557"
        assert "bk-active" in items[0].get_attribute('class')
        assert "bk-active" not in items[1].get_attribute('class')
        assert "bk-active" not in items[2].get_attribute('class')

    def test_case_insensitivity(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = AutocompleteInput(title="title", case_sensitive=False, completions = ["100001", "aaaaaa", "aaabbb", "AAAaAA", "AAABbB"])

        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' in el.get_attribute('style')

        # double click to highlight and overwrite old text
        el = find_element_for(page.driver, text_input, "input")
        enter_text_in_element(page.driver, el, "aAa", click=2, enter=False)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 4
        assert items[0].text == "aaaaaa"
        assert items[1].text == "aaabbb"
        assert items[2].text == "AAAaAA"
        assert items[3].text == "AAABbB"
        assert "bk-active" in items[0].get_attribute('class')

        el = find_element_for(page.driver, text_input, "input")
        enter_text_in_element(page.driver, el, "aAaB", click=2, enter=False)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 2
        assert items[0].text == "aaabbb"
        assert items[1].text == "AAABbB"
        assert "bk-active" in items[0].get_attribute('class')
        assert "bk-active" not in items[1].get_attribute('class')

        enter_text_in_element(page.driver, el, Keys.DOWN, click=0, enter=False)
        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 2
        assert items[0].text == "aaabbb"
        assert items[1].text == "AAABbB"
        assert "bk-active" not in items[0].get_attribute('class')
        assert "bk-active" in items[1].get_attribute('class')

        assert page.has_no_console_errors()

    def test_case_sensitivity(self, bokeh_model_page: BokehModelPage) -> None:
        # case_sensitive=True by default
        text_input = AutocompleteInput(title="title", completions = ["100001", "aAaaaa", "aAaBbb", "AAAaAA", "aAaBbB"])

        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' in el.get_attribute('style')

        # double click to highlight and overwrite old text
        el = find_element_for(page.driver, text_input, "input")
        enter_text_in_element(page.driver, el, "aAa", click=2, enter=False)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 3
        assert items[0].text == "aAaaaa"
        assert items[1].text == "aAaBbb"
        assert items[2].text == "aAaBbB"
        assert "bk-active" in items[0].get_attribute('class')

        el = find_element_for(page.driver, text_input, "input")
        enter_text_in_element(page.driver, el, "aAaB", click=2, enter=False)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 2
        assert items[0].text == "aAaBbb"
        assert items[1].text == "aAaBbB"
        assert "bk-active" in items[0].get_attribute('class')

        enter_text_in_element(page.driver, el, Keys.DOWN, click=0, enter=False)
        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 2
        assert items[0].text == "aAaBbb"
        assert items[1].text == "aAaBbB"
        assert "bk-active" not in items[0].get_attribute('class')
        assert "bk-active" in items[1].get_attribute('class')

        assert page.has_no_console_errors()

    def test_server_restriction_to_list(self, bokeh_server_page: BokehServerPage) -> None:
        """Test that input entered manually doesn't end up in the value."""
        text_input = AutocompleteInput(completions = ["aAaBbb"], restrict=True)

        def add_autocomplete(doc):
            # note: for some reason, bokeh_server_page requires a 'canvas' in the document
            plot = Plot()
            doc.add_root(column(text_input,plot))

        page = bokeh_server_page(add_autocomplete)

        el = find_element_for(page.driver, text_input, "input")
        text = "not in completions"
        enter_text_in_element(page.driver, el, text, click=1, enter=True)

        assert text_input.value == ''
        assert page.has_no_console_errors()

    def test_no_restriction(self, bokeh_model_page: BokehModelPage) -> None:
        """Test effect of 'restrict=False' with explicit JS callback"""
        text_input = AutocompleteInput(completions = ["aAaBbb", "aAaBbB"], restrict=False)
        text_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, "input")
        text = "not in completions"
        enter_text_in_element(page.driver, el, text, click=1, enter=True)

        results = page.results
        assert results['value'] == text
        assert page.has_no_console_errors()

    def test_server_no_restriction(self, bokeh_server_page: BokehServerPage) -> None:
        """Test effect of 'restrict=False' without explicit callback."""
        text_input = AutocompleteInput(completions = ["aAaBbb", "aAaBbB"], restrict=False)

        def add_autocomplete(doc):
            # note: for some reason, bokeh_server_page requires a 'canvas' in the document
            plot = Plot()
            doc.add_root(column(text_input,plot))

        page = bokeh_server_page(add_autocomplete)

        el = find_element_for(page.driver, text_input, "input")
        text = "not in completions"
        enter_text_in_element(page.driver, el, text, click=1, enter=True)

        assert text_input.value == text
        assert page.has_no_console_errors()

    def test_arrow_cannot_escape_menu(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = AutocompleteInput(title="title", completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' in el.get_attribute('style')

        el = find_element_for(page.driver, text_input, "input")
        enter_text_in_element(page.driver, el, "123", click=2, enter=False)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" in items[0].get_attribute('class')
        assert "bk-active" not in items[1].get_attribute('class')

        # arrow down moves to second item
        enter_text_in_element(page.driver, el, Keys.DOWN, click=0, enter=False)
        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" not in items[0].get_attribute('class')
        assert "bk-active" in items[1].get_attribute('class')

        # arrow down again has no effect
        enter_text_in_element(page.driver, el, Keys.DOWN, click=0, enter=False)
        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" not in items[0].get_attribute('class')
        assert "bk-active" in items[1].get_attribute('class')

        # arrow up moves to first item
        enter_text_in_element(page.driver, el, Keys.UP, click=0, enter=False)
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" in items[0].get_attribute('class')
        assert "bk-active" not in items[1].get_attribute('class')

        # arrow up again has no effect
        enter_text_in_element(page.driver, el, Keys.UP, click=0, enter=False)
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" in items[0].get_attribute('class')
        assert "bk-active" not in items[1].get_attribute('class')

        assert page.has_no_console_errors()

    def test_mouse_hover(self, bokeh_model_page: BokehModelPage) -> None:
        text_input = AutocompleteInput(title="title", completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' in el.get_attribute('style')

        el = find_element_for(page.driver, text_input, "input")
        enter_text_in_element(page.driver, el, "123", click=2, enter=False)

        el = find_element_for(page.driver, text_input, ".bk-menu")
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements(By.TAG_NAME, "div")
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" in items[0].get_attribute('class')
        assert "bk-active" not in items[1].get_attribute('class')

        # hover over second element
        items = el.find_elements(By.TAG_NAME, "div")
        hover_element(page.driver, items[1])
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" not in items[0].get_attribute('class')
        assert "bk-active" in items[1].get_attribute('class')

    def test_unrestricted_selection_callback_count(self, bokeh_server_page: BokehServerPage) -> None:
        class CallbackCounter:
            def __init__(self) -> None:
                self.count = 0

            def increment(self, attr, old, new) -> None:
                self.count += 1
                self.new = new

        counter = CallbackCounter()

        input_box = AutocompleteInput(completions = ["100001", "12344556"], restrict=False)

        def unrestricted_input(doc):
            input_box.on_change('value', counter.increment)
            plot = Plot()
            doc.add_root(column(input_box, plot))

        page = bokeh_server_page(unrestricted_input)

        el = find_element_for(page.driver, input_box, "input")
        enter_text_in_element(page.driver, el, "ASDF", enter=True)
        assert(counter.count == 1)
        assert(counter.new == "ASDF")

    def test_server_on_change_no_round_trip_without_enter_or_click(self, bokeh_server_page: BokehServerPage) -> None:
        input_box = AutocompleteInput()
        modify_doc, _ = mk_modify_doc(input_box)
        page = bokeh_server_page(modify_doc)

        el = find_element_for(page.driver, input_box, "input")
        enter_text_in_element(page.driver, el, "pre", enter=False)  # not change event if enter is not pressed

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["a", "b"]

        assert page.has_no_console_errors()

    def test_server_on_change_round_trip_full_entry(self, bokeh_server_page: BokehServerPage) -> None:
        input_box = AutocompleteInput()
        modify_doc, plot = mk_modify_doc(input_box)
        page = bokeh_server_page(modify_doc)

        # double click to highlight and overwrite old text
        el = find_element_for(page.driver, input_box, "input")
        enter_text_in_element(page.driver, el, "100001", click=2)

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["400", "100001"]

        enter_text_in_element(page.driver, el, "12344556", click=2)

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["100001", "12344556"]

        # Check clicking outside input also triggers
        enter_text_in_element(page.driver, el, "3194567289", click=2)
        page.click_canvas_at_position(plot, 10, 10)

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["12344556", "3194567289"]

    def test_server_on_change_round_trip_partial_entry(self, bokeh_server_page: BokehServerPage) -> None:
        input_box = AutocompleteInput()
        modify_doc, plot = mk_modify_doc(input_box)
        page = bokeh_server_page(modify_doc)

        # double click to highlight and overwrite old text
        el = find_element_for(page.driver, input_box, "input")
        enter_text_in_element(page.driver, el, "100", click=2)

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["400", "100001"]

        enter_text_in_element(page.driver, el, "123", click=2)

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["100001", "12344556"]

        # Check clicking outside input also triggers
        enter_text_in_element(page.driver, el, "319", click=2, enter=False)
        page.click_canvas_at_position(plot, 10, 10)

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["12344556", "3194567289"]

        assert page.has_no_console_errors()

    def test_server_on_change_round_trip_menu_entry(self, bokeh_server_page: BokehServerPage) -> None:
        input_box = AutocompleteInput()
        modify_doc, _ = mk_modify_doc(input_box)
        page = bokeh_server_page(modify_doc)

        # double click to highlight and overwrite old text
        el = find_element_for(page.driver, input_box, "input")
        enter_text_in_element(page.driver, el, "123", click=2, enter=False)
        enter_text_in_element(page.driver, el, Keys.DOWN, click=0)

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["400", "12344557"]

        enter_text_in_element(page.driver, el, "123", click=2, enter=False)

        el = find_element_for(page.driver, input_box, ".bk-menu")
        items = el.find_elements(By.TAG_NAME, "div")
        hover_element(page.driver, items[1])
        items[1].click()

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ["400", "12344557"]

        assert page.has_no_console_errors()
