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

# Bokeh imports
from bokeh.core.enums import ButtonType
from bokeh.layouts import column
from bokeh.models import Button, Circle, ColumnDataSource, CustomAction, CustomJS, Plot, Range1d
from bokeh._testing.util.selenium import RECORD

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

@pytest.mark.integration
@pytest.mark.selenium
class Test_Button(object):

    def test_displays_label(self, bokeh_model_page):
        button = Button(label="label", css_classes=["foo"])

        page = bokeh_model_page(button)

        button_div = page.driver.find_element_by_class_name('foo')
        button = button_div.find_element_by_tag_name("button")
        assert button.text == "label"

    @pytest.mark.parametrize('typ', list(ButtonType))
    def test_displays_button_type(self, typ, bokeh_model_page):
        button = Button(button_type=typ, css_classes=["foo"])

        page = bokeh_model_page(button)

        button_div = page.driver.find_element_by_class_name('foo')
        button = button_div.find_element_by_tag_name("button")
        assert typ in button.get_attribute('class')

    def test_server_on_click_round_trip(self, bokeh_server_page):

        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            button = Button(css_classes=['foo'])
            def cb(): source.data=dict(x=[10, 20], y=[10, 10])
            button.on_click(cb)
            doc.add_root(column(button, plot))

        page = bokeh_server_page(modify_doc)

        button = page.driver.find_element_by_class_name('foo')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [10, 20], 'y': [10, 10]}}

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_server_on_event_round_trip(self, bokeh_server_page):

        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            button = Button(css_classes=['foo'])
            def cb(event): source.data=dict(x=[10, 20], y=[10, 10])
            button.on_event('button_click', cb)
            doc.add_root(column(button, plot))

        page = bokeh_server_page(modify_doc)

        button = page.driver.find_element_by_class_name('foo')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [10, 20], 'y': [10, 10]}}

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_callback_property_executes(self, bokeh_model_page):
        button = Button(css_classes=['foo'])
        button.callback = CustomJS(code=RECORD("clicked", "true"))

        page = bokeh_model_page(button)

        button = page.driver.find_element_by_class_name('foo')
        button.click()

        results = page.results
        assert results ==  {'clicked': True}

        assert page.has_no_console_errors()

    def test_js_on_event_executes(self, bokeh_model_page):
        button = Button(css_classes=['foo'])
        button.js_on_event('button_click', CustomJS(code=RECORD("clicked", "true")))

        page = bokeh_model_page(button)

        button = page.driver.find_element_by_class_name('foo')
        button.click()

        results = page.results
        assert results ==  {'clicked': True}

        assert page.has_no_console_errors()

    def test_js_on_click_executes(self, bokeh_model_page):
        button = Button(css_classes=['foo'])
        button.js_on_click(CustomJS(code=RECORD("clicked", "true")))

        page = bokeh_model_page(button)

        button = page.driver.find_element_by_class_name('foo')
        button.click()

        results = page.results
        assert results ==  {'clicked': True}

        assert page.has_no_console_errors()
