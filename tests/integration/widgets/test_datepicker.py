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

# Standard library imports
from datetime import date

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    DatePicker,
    Plot,
    Range1d,
    Scatter,
)
from tests.support.plugins.project import BokehModelPage, BokehServerPage
from tests.support.util.selenium import RECORD, find_element_for

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)


@pytest.mark.selenium
class Test_DatePicker:
    def test_basic(self, bokeh_model_page: BokehModelPage) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30")

        page = bokeh_model_page(dp)

        el = find_element_for(page.driver, dp, "label")
        assert el.text == "Select date"

        el = find_element_for(page.driver, dp, '.flatpickr-calendar')
        assert "inline" not in el.get_attribute("class")

        assert page.has_no_console_errors()

    def test_inline(self, bokeh_model_page: BokehModelPage) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30", inline=True)

        page = bokeh_model_page(dp)

        el = find_element_for(page.driver, dp, "label")
        assert el.text == "Select date"

        el = find_element_for(page.driver, dp, '.flatpickr-calendar')
        assert "inline" in el.get_attribute("class")

        assert page.has_no_console_errors()

    def test_widget_disabled(self, bokeh_model_page: BokehModelPage) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30", disabled=True)

        page = bokeh_model_page(dp)

        el = find_element_for(page.driver, dp, '.flatpickr-input')
        assert el.get_attribute("disabled") == "true"

        assert page.has_no_console_errors()

    def test_disabled_dates(self, bokeh_model_page: BokehModelPage) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30",
                        disabled_dates=["2019-09-14", ("2019-09-16", date(2019, 9, 18))])

        page = bokeh_model_page(dp)

        el = find_element_for(page.driver, dp, "label")
        el.click()

        # not disabled
        el = find_element_for(page.driver, dp, 'span[aria-label="September 13, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        el = find_element_for(page.driver, dp, 'span[aria-label="September 14, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        # not disabled
        el = find_element_for(page.driver, dp, 'span[aria-label="September 15, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        el = find_element_for(page.driver, dp, 'span[aria-label="September 16, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        el = find_element_for(page.driver, dp, 'span[aria-label="September 17, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        el = find_element_for(page.driver, dp, 'span[aria-label="September 18, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        # not disabled
        el = find_element_for(page.driver, dp, 'span[aria-label="September 19, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        assert page.has_no_console_errors()

    def test_enabled_dates(self, bokeh_model_page: BokehModelPage) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30",
                        enabled_dates=["2019-09-14", ("2019-09-16", date(2019, 9, 18))])

        page = bokeh_model_page(dp)

        el = find_element_for(page.driver, dp, "label")
        el.click()

        # not enabled
        el = find_element_for(page.driver, dp, 'span[aria-label="September 13, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        el = find_element_for(page.driver, dp, 'span[aria-label="September 14, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        # not enabled
        el = find_element_for(page.driver, dp, 'span[aria-label="September 15, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        el = find_element_for(page.driver, dp, 'span[aria-label="September 16, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        el = find_element_for(page.driver, dp, 'span[aria-label="September 17, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

        el = find_element_for(page.driver, dp, 'span[aria-label="September 18, 2019"]')
        assert "flatpickr-disabled" not in el.get_attribute("class")

         # not enabled
        el = find_element_for(page.driver, dp, 'span[aria-label="September 19, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        assert page.has_no_console_errors()

    def _test_js_on_change_executes(self, bokeh_model_page: BokehModelPage) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30")
        dp.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(dp)

        el = find_element_for(page.driver, dp, "input")
        el.click()
        el.click()

        el = find_element_for(page.driver, dp, 'span[aria-label="September 16, 2019"]')
        assert el.is_displayed()
        el.click()

        results = page.results
        assert results['value'] == '2019-09-16'

        el = find_element_for(page.driver, dp, '.bk-input')
        assert el.get_attribute('value') == '2019-09-16'

        assert page.has_no_console_errors()

    def _test_server_on_change_round_trip(self, bokeh_server_page: BokehServerPage) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30")

        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))
            plot.add_glyph(source, Scatter(x='x', y='y', size=20))
            def cb(attr, old, new):
                source.data['val'] = [old, new]
            dp.on_change('value', cb)
            doc.add_root(column(dp, plot))

        page = bokeh_server_page(modify_doc)

        el = find_element_for(page.driver, dp, "input")
        el.click()
        el.click()

        el = find_element_for(page.driver, dp, 'span[aria-label="September 16, 2019"]')
        assert el.is_displayed()
        el.click()

        page.eval_custom_action()

        results = page.results
        assert results['data']['val'] == ['2019-09-20', '2019-09-16']

    def _test_server_update_disabled(self, bokeh_server_page: BokehServerPage) -> None:
        dp = DatePicker(title='Select date', value=date(2019, 9, 20), min_date=date(2019, 9, 1), max_date="2019-09-30")

        def modify_doc(doc):
            source = ColumnDataSource(dict(x=[1, 2], y=[1, 1], val=["a", "b"]))
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))
            plot.add_glyph(source, Scatter(x='x', y='y', size=20))
            def cb(attr, old, new):
                source.data['val'] = [old, new]
                dp.disabled_dates = ["2019-09-15"]
            dp.on_change('value', cb)
            doc.add_root(column(dp, plot))

        page = bokeh_server_page(modify_doc)

        el = find_element_for(page.driver, dp, "input")
        el.click()
        el.click()

        el = find_element_for(page.driver, dp, 'span[aria-label="September 16, 2019"]')
        assert el.is_displayed()
        el.click()

        page.eval_custom_action()

        el = find_element_for(page.driver, dp, 'span[aria-label="September 15, 2019"]')
        assert "flatpickr-disabled" in el.get_attribute("class")

        results = page.results
        assert results['data']['val'] == ['2019-09-20', '2019-09-16']
