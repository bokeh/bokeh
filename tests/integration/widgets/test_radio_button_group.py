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
from bokeh.layouts import column
from bokeh.models import Circle, ColumnDataSource, CustomAction, CustomJS, Plot, RadioButtonGroup, Range1d
from bokeh._testing.util.selenium import RECORD

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

LABELS = ["Option 1", "Option 2", "Option 3"]

@pytest.mark.integration
@pytest.mark.selenium
class Test_RadioButtonGroup(object):

    def test_server_on_change_round_trip(self, bokeh_server_page):
        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            group = RadioButtonGroup(labels=LABELS, css_classes=["foo"])
            def cb(active):
                source.data['val'] = [active, "b"]
            group.on_click(cb)
            doc.add_root(column(group, plot))

        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_css_selector('.foo .bk-btn:nth-child(3)')
        el.click()

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == [2, "b"]

        el = page.driver.find_element_by_css_selector('.foo .bk-btn:nth-child(1)')
        el.click()

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == [0, "b"]

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_callback_property_executes(self, bokeh_model_page):
        group = RadioButtonGroup(labels=LABELS, css_classes=["foo"])
        group.callback = CustomJS(code=RECORD("active", "cb_obj.active"))

        page = bokeh_model_page(group)

        el = page.driver.find_element_by_css_selector('.foo .bk-btn:nth-child(3)')
        el.click()

        results = page.results
        assert results['active'] == 2

        el = page.driver.find_element_by_css_selector('.foo .bk-btn:nth-child(1)')
        el.click()

        results = page.results
        assert results['active'] == 0

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page):
        group = RadioButtonGroup(labels=LABELS, css_classes=["foo"])
        group.js_on_click(CustomJS(code=RECORD("active", "cb_obj.active")))

        page = bokeh_model_page(group)

        el = page.driver.find_element_by_css_selector('.foo .bk-btn:nth-child(3)')
        el.click()

        results = page.results
        assert results['active'] == 2

        el = page.driver.find_element_by_css_selector('.foo .bk-btn:nth-child(1)')
        el.click()

        results = page.results
        assert results['active'] == 0

        assert page.has_no_console_errors()
