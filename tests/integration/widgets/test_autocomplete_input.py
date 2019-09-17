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
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from selenium.webdriver.common.keys import Keys

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import AutocompleteInput, Circle, ColumnDataSource, CustomAction, CustomJS, Plot, Range1d
from bokeh._testing.util.selenium import enter_text_in_element, hover_element, RECORD

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

def modify_doc(doc):
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
    plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
    plot.add_glyph(source, Circle(x='x', y='y', size=20))
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
    input_box = AutocompleteInput(css_classes=["foo"])
    input_box.title = "title"
    input_box.value = "400"
    input_box.completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"]
    def cb(attr, old, new):
        source.data['val'] = [old, new]
    input_box.on_change('value', cb)
    doc.add_root(column(input_box, plot))

@pytest.mark.integration
@pytest.mark.selenium
class Test_AutocompleteInput(object):

    def test_displays_text_input(self, bokeh_model_page):
        text_input = AutocompleteInput(css_classes=["foo"], completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page):
        text_input = AutocompleteInput(title="title", css_classes=["foo"], completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == "title"
        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('placeholder') == ""
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    def test_displays_menu(self, bokeh_model_page):
        text_input = AutocompleteInput(title="title", css_classes=["foo"], completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo .bk-menu')
        assert 'display: none;' in el.get_attribute('style')

        # double click to highlight and overwrite old text
        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "100", click=2, enter=False)

        el = page.driver.find_element_by_css_selector('.foo .bk-menu')
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements_by_tag_name("div")
        assert len(items) == 1
        assert items[0].text == "100001"
        assert "bk-active" in items[0].get_attribute('class')

        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "123", click=2, enter=False)

        el = page.driver.find_element_by_css_selector('.foo .bk-menu')
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements_by_tag_name("div")
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" in items[0].get_attribute('class')
        assert "bk-active" not in items[1].get_attribute('class')

        enter_text_in_element(page.driver, el, Keys.DOWN, click=0, enter=False)
        items = el.find_elements_by_tag_name("div")
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" not in items[0].get_attribute('class')
        assert "bk-active" in items[1].get_attribute('class')

        assert page.has_no_console_errors()

    def test_min_characters(self, bokeh_model_page):
        text_input = AutocompleteInput(title="title", css_classes=["foo"],
                                       completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"],
                                       min_characters=1)

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo .bk-menu')
        assert 'display: none;' in el.get_attribute('style')

        # double click to highlight and overwrite old text
        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "1", click=2, enter=False)

        el = page.driver.find_element_by_css_selector('.foo .bk-menu')
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements_by_tag_name("div")
        assert len(items) == 3
        assert items[0].text == "100001"
        assert items[1].text == "12344556"
        assert items[2].text == "12344557"
        assert "bk-active" in items[0].get_attribute('class')
        assert "bk-active" not in items[1].get_attribute('class')
        assert "bk-active" not in items[2].get_attribute('class')

    def test_arrow_cannot_escape_menu(self, bokeh_model_page):
        text_input = AutocompleteInput(title="title", css_classes=["foo"], completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo .bk-menu')
        assert 'display: none;' in el.get_attribute('style')

        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "123", click=2, enter=False)

        el = page.driver.find_element_by_css_selector('.foo .bk-menu')
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements_by_tag_name("div")
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" in items[0].get_attribute('class')
        assert "bk-active" not in items[1].get_attribute('class')

        # arrow down moves to second item
        enter_text_in_element(page.driver, el, Keys.DOWN, click=0, enter=False)
        items = el.find_elements_by_tag_name("div")
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" not in items[0].get_attribute('class')
        assert "bk-active" in items[1].get_attribute('class')

        # arrow down again has no effect
        enter_text_in_element(page.driver, el, Keys.DOWN, click=0, enter=False)
        items = el.find_elements_by_tag_name("div")
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

    def test_mouse_hover(self, bokeh_model_page):
        text_input = AutocompleteInput(title="title", css_classes=["foo"], completions = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo .bk-menu')
        assert 'display: none;' in el.get_attribute('style')

        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "123", click=2, enter=False)

        el = page.driver.find_element_by_css_selector('.foo .bk-menu')
        assert 'display: none;' not in el.get_attribute('style')

        items = el.find_elements_by_tag_name("div")
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" in items[0].get_attribute('class')
        assert "bk-active" not in items[1].get_attribute('class')

        # hover over second element
        items = el.find_elements_by_tag_name("div")
        hover_element(page.driver, items[1])
        assert len(items) == 2
        assert items[0].text == "12344556"
        assert items[1].text == "12344557"
        assert "bk-active" not in items[0].get_attribute('class')
        assert "bk-active" in items[1].get_attribute('class')

    # XXX (bev) always works locally but fails intermittently (often) on TravisCI
    @pytest.mark.skip
    def test_server_on_change_no_round_trip_without_enter_or_click(self, bokeh_server_page):
        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "pre", enter=False)  # not change event if enter is not pressed

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["a", "b"]

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_server_on_change_round_trip_full_entry(self, bokeh_server_page):
        page = bokeh_server_page(modify_doc)

        # double click to highlight and overwrite old text
        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "100001", click=2)

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["400", "100001"]

        enter_text_in_element(page.driver, el, "12344556", click=2)

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["100001", "12344556"]

        # Check clicking outside input also triggers
        enter_text_in_element(page.driver, el, "3194567289", click=2)
        page.click_canvas_at_position(10, 10)

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["12344556", "3194567289"]

    def test_server_on_change_round_trip_partial_entry(self, bokeh_server_page):
        page = bokeh_server_page(modify_doc)

        # double click to highlight and overwrite old text
        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "100", click=2)

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["400", "100001"]

        enter_text_in_element(page.driver, el, "123", click=2)

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["100001", "12344556"]

        # Check clicking outside input also triggers
        enter_text_in_element(page.driver, el, "319", click=2, enter=False)
        page.click_canvas_at_position(10, 10)

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["12344556", "3194567289"]

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_server_on_change_round_trip_menu_entry(self, bokeh_server_page):
        page = bokeh_server_page(modify_doc)

        # double click to highlight and overwrite old text
        el = page.driver.find_element_by_css_selector('.foo input')
        enter_text_in_element(page.driver, el, "123", click=2, enter=False)
        enter_text_in_element(page.driver, el, Keys.DOWN, click=0)

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["400", "12344557"]

        enter_text_in_element(page.driver, el, "123", click=2, enter=False)

        el = page.driver.find_element_by_css_selector('.foo .bk-menu')
        items = el.find_elements_by_tag_name("div")
        hover_element(page.driver, items[1])
        items[1].click()

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ["400", "12344557"]

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()
