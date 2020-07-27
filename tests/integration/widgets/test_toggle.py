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
from bokeh.core.enums import ButtonType
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    Plot,
    Range1d,
    Toggle,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)


@pytest.mark.selenium
class Test_Toggle:
    def test_displays_label(self, bokeh_model_page) -> None:
        button = Toggle(label="label", css_classes=["foo"])

        page = bokeh_model_page(button)

        button = page.driver.find_element_by_css_selector('.foo .bk-btn')
        assert button.text == "label"

    @pytest.mark.parametrize('typ', list(ButtonType))
    def test_displays_button_type(self, typ, bokeh_model_page) -> None:
        button = Toggle(button_type=typ, css_classes=["foo"])

        page = bokeh_model_page(button)

        button = page.driver.find_element_by_css_selector('.foo .bk-btn')
        assert typ in button.get_attribute('class')

    @flaky(max_runs=10)
    def test_server_on_click_round_trip(self, bokeh_server_page) -> None:

        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            button = Toggle(css_classes=['foo'])
            def cb(value):
                if value:
                    source.data=dict(x=[10, 20], y=[10, 10])
                else:
                    source.data=dict(x=[100, 200], y=[100, 100])
            button.on_click(cb)
            doc.add_root(column(button, plot))

        page = bokeh_server_page(modify_doc)

        button = page.driver.find_element_by_css_selector('.foo .bk-btn')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results == {'data': {'x': [10, 20], 'y': [10, 10]}}

        button = page.driver.find_element_by_css_selector('.foo .bk-btn')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results == {'data': {'x': [100, 200], 'y': [100, 100]}}

        button = page.driver.find_element_by_css_selector('.foo .bk-btn')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results == {'data': {'x': [10, 20], 'y': [10, 10]}}

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    # XXX (bev) Toggle does not register to process ButtonClick events

    def test_js_on_click_executes(self, bokeh_model_page) -> None:
        button = Toggle(css_classes=['foo'])
        button.js_on_click(CustomJS(code=RECORD("value", "cb_obj.active")))

        page = bokeh_model_page(button)

        button = page.driver.find_element_by_css_selector('.foo .bk-btn')
        button.click()

        results = page.results
        assert results == {'value': True}

        button = page.driver.find_element_by_css_selector('.foo .bk-btn')
        button.click()

        results = page.results
        assert results == {'value': False}

        button = page.driver.find_element_by_css_selector('.foo .bk-btn')
        button.click()

        results = page.results
        assert results == {'value': True}

        assert page.has_no_console_errors()
