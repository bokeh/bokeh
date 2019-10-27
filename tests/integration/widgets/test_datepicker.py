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

# Standard library imports
from datetime import datetime

# External imports

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import Circle, ColumnDataSource, CustomAction, CustomJS, DatePicker, Plot, Range1d
from bokeh._testing.util.selenium import RECORD

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

@pytest.mark.integration
@pytest.mark.selenium
class Test_DatePicker(object):

    def test_basic(self, bokeh_model_page):
        dp = DatePicker(title='Select date', value=datetime(2019, 9, 20), min_date=datetime(2019, 9, 1), max_date=datetime.utcnow(), css_classes=["foo"])

        page = bokeh_model_page(dp)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == "Select date"

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page):
        dp = DatePicker(title='Select date', value=datetime(2019, 9, 20), min_date=datetime(2019, 9, 1), max_date=datetime.utcnow(), css_classes=["foo"])
        dp.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(dp)

        el = page.driver.find_element_by_css_selector('.foo input')
        el.click()

        el = page.driver.find_element_by_css_selector('button[data-pika-day="16"]')
        el.click()

        results = page.results
        assert results['value'] == 'Mon Sep 16 2019'

        el = page.driver.find_element_by_css_selector('.bk-input')
        assert el.get_attribute('value') == 'Mon Sep 16 2019'

        assert page.has_no_console_errors()

    def test_server_on_change_round_trip(self, bokeh_server_page):
        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            dp = DatePicker(title='Select date', value=datetime(2019, 9, 20), min_date=datetime(2019, 9, 1), max_date=datetime.utcnow(), css_classes=["foo"])
            def cb(attr, old, new):
                source.data['val'] = [old, new]
            dp.on_change('value', cb)
            doc.add_root(column(dp, plot))

        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_css_selector('.foo input')
        el.click()

        el = page.driver.find_element_by_css_selector('button[data-pika-day="16"]')
        el.click()

        page.click_custom_action()

        results = page.results
        d0 = datetime.utcfromtimestamp(results['data']['val'][0]/1000)
        assert d0.timetuple()[:3] == (2019, 9, 20)
        d1 = datetime.utcfromtimestamp(results['data']['val'][1]/1000)
        assert d1.timetuple()[:3] == (2019, 9, 16)
