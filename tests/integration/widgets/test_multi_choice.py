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
from selenium.webdriver.common.keys import Keys

# Bokeh imports
from bokeh._testing.util.selenium import RECORD
from bokeh.layouts import row
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    MultiChoice,
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
    plot.add_glyph(source, Circle(x='x', y='y', size=20))
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
    input_box = MultiChoice(css_classes=["foo"])
    input_box.title = "title"
    input_box.options = ["100001", "12344556", "12344557", "3194567289", "209374209374"]
    input_box.value = ["12344556", "12344557"]
    def cb(attr, old, new):
        source.data['val'] = [old, new]
    input_box.on_change('value', cb)
    doc.add_root(row(input_box, plot))


@pytest.mark.selenium
class Test_MultiChoice:
    def test_displays_multi_choice(self, bokeh_model_page) -> None:
        text_input = MultiChoice(css_classes=["foo"], options = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    def test_displays_title(self, bokeh_model_page) -> None:
        text_input = MultiChoice(title="title", css_classes=["foo"], options = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == "title"
        el = page.driver.find_element_by_css_selector('.foo input')
        assert el.get_attribute('placeholder') == ""
        assert el.get_attribute('type') == "text"

        assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_displays_menu(self, bokeh_model_page) -> None:
        text_input = MultiChoice(title="title", css_classes=["foo"], options = ["100001", "12344556", "12344557", "3194567289", "209374209374"])

        page = bokeh_model_page(text_input)

        el = page.driver.find_element_by_css_selector('.foo .choices__list--dropdown')
        assert 'is-active' not in el.get_attribute('class')

        # double click to highlight and overwrite old text
        inp = page.driver.find_element_by_css_selector('.foo input')
        inp.click()
        assert 'is-active' in el.get_attribute('class')

        inp.send_keys(Keys.ENTER)

        selected = page.driver.find_element_by_css_selector('.foo .choices__list--multiple')
        items = selected.find_elements_by_css_selector("div")
        assert len(items) == 1

        item = page.driver.find_element_by_css_selector('.foo .choices__list--multiple div.choices__item')
        assert '100001' == item.get_attribute('data-value')

        delete_button = page.driver.find_element_by_css_selector('.foo .choices__item button')
        assert "Remove item: '100001'" == delete_button.get_attribute('aria-label')

        delete_button.click()

        selected = page.driver.find_element_by_css_selector('.foo .choices__list--multiple')
        items = selected.find_elements_by_css_selector("div")
        assert len(items) == 0

        assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_on_change_round_trip_on_enter(self, bokeh_server_page) -> None:
        page = bokeh_server_page(modify_doc)

        inp = page.driver.find_element_by_css_selector('.foo input')
        inp.click()

        inp.send_keys(Keys.ENTER)

        button = page.driver.find_element_by_class_name("bk-toolbar-button-custom-action")
        button.click()

        results = page.results
        assert results['data']['val'] == [['12344556', '12344557'], ['12344556', '12344557', '100001']]
