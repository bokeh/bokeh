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
from datetime import date

# External imports
from flaky import flaky

# Bokeh imports
from bokeh._testing.util.selenium import RECORD
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    DatePicker,
    Plot,
    Range1d,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)


@pytest.mark.selenium
class Test_DatePicker:
    def test_basic(self, bokeh_model_page) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30", css_classes=["foo"])

        page = bokeh_model_page(dp)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == "Select date"

        el = page.driver.find_element_by_css_selector('.flatpickr-calendar')
        assert "inline" not in el.get_attribute("class")

        assert page.has_no_console_errors()

    def test_inline(self, bokeh_model_page) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30",
                        inline=True, css_classes=["foo"])

        page = bokeh_model_page(dp)

        el = page.driver.find_element_by_css_selector('.foo label')
        assert el.text == "Select date"

        el = page.driver.find_element_by_css_selector('.flatpickr-calendar')
        assert "inline" in el.get_attribute("class")

        assert page.has_no_console_errors()

    def test_widget_disabled(self, bokeh_model_page) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30",
                        disabled=True, css_classes=["foo"])

        page = bokeh_model_page(dp)

        el = page.driver.find_element_by_css_selector('.flatpickr-input')
        assert el.get_attribute("disabled") == "true"

        assert page.has_no_console_errors()

    def test_disabled_dates(self, bokeh_model_page) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30",
                        disabled_dates=["2019-09-14", ("2019-09-16", date(2019, 9, 18))], css_classes=["foo"])

        page = bokeh_model_page(dp)

        el = page.driver.find_element_by_css_selector('.foo label')
        el.click()

        # not disabled
        el = page.driver.find_element_by_css_selector('span[aria-label="September 13, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        el = page.driver.find_element_by_css_selector('span[aria-label="September 14, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        # not disabled
        el = page.driver.find_element_by_css_selector('span[aria-label="September 15, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        el = page.driver.find_element_by_css_selector('span[aria-label="September 16, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        el = page.driver.find_element_by_css_selector('span[aria-label="September 17, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        el = page.driver.find_element_by_css_selector('span[aria-label="September 18, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        # not disabled
        el = page.driver.find_element_by_css_selector('span[aria-label="September 19, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        assert page.has_no_console_errors()

    def test_enabled_dates(self, bokeh_model_page) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30",
                        enabled_dates=["2019-09-14", ("2019-09-16", date(2019, 9, 18))], css_classes=["foo"])

        page = bokeh_model_page(dp)

        el = page.driver.find_element_by_css_selector('.foo label')
        el.click()

        # not enabled
        el = page.driver.find_element_by_css_selector('span[aria-label="September 13, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        el = page.driver.find_element_by_css_selector('span[aria-label="September 14, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        # not enabled
        el = page.driver.find_element_by_css_selector('span[aria-label="September 15, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        el = page.driver.find_element_by_css_selector('span[aria-label="September 16, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        el = page.driver.find_element_by_css_selector('span[aria-label="September 17, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        el = page.driver.find_element_by_css_selector('span[aria-label="September 18, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

         # not enabled
        el = page.driver.find_element_by_css_selector('span[aria-label="September 19, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        assert page.has_no_console_errors()

    def test_js_on_change_executes(self, bokeh_model_page) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30", css_classes=["foo"])
        dp.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(dp)

        el = page.driver.find_element_by_css_selector('.foo input')
        el.click()

        el = page.driver.find_element_by_css_selector('span[aria-label="September 16, 2019"]')
        el.click()

        results = page.results
        assert results['value'] == '2019-09-16'

        el = page.driver.find_element_by_css_selector('.bk-input')
        assert el.get_attribute('value') == '2019-09-16'

        assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_on_change_round_trip(self, bokeh_server_page) -> None:
        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30", css_classes=["foo"])
            def cb(attr, old, new):
                source.data['val'] = [old, new]
            dp.on_change('value', cb)
            doc.add_root(column(dp, plot))

        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_css_selector('.foo input')
        el.click()

        el = page.driver.find_element_by_css_selector('span[aria-label="September 16, 2019"]')
        el.click()

        page.click_custom_action()

        results = page.results
        assert results['data']['val'] == ['2019-09-20', '2019-09-16']

    @flaky(max_runs=10)
    def test_server_update_disabled(self, bokeh_server_page) -> None:
        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))
            plot.add_glyph(source, Circle(x='x', y='y', size=20))
            dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30", css_classes=["foo"])
            def cb(attr, old, new):
                source.data['val'] = [old, new]
                dp.disabled_dates = ["2019-09-15"]
            dp.on_change('value', cb)
            doc.add_root(column(dp, plot))

        page = bokeh_server_page(modify_doc)

        el = page.driver.find_element_by_css_selector('.foo input')
        el.click()

        el = page.driver.find_element_by_css_selector('span[aria-label="September 16, 2019"]')
        el.click()

        page.click_custom_action()

        el = page.driver.find_element_by_css_selector('span[aria-label="September 15, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        results = page.results
        assert results['data']['val'] == ['2019-09-20', '2019-09-16']
