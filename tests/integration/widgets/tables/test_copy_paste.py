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
from time import sleep

# External imports
from selenium.webdriver.common.keys import Keys

# Bokeh imports
from bokeh._testing.util.selenium import (
    RECORD,
    enter_text_in_element,
    get_table_row,
    shift_click,
)
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, CustomJS, DataTable, TableColumn, TextInput

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)


@pytest.mark.selenium
class Test_DataTableCopyPaste:
    def test_single_row_copy(self, bokeh_model_page) -> None:
        data = {'x': [1,2,3,4], 'y': [1,1,1,1], 'd': ['foo', 'bar', 'baz', 'quux']}
        source = ColumnDataSource(data)
        table = DataTable(columns=[
            TableColumn(field="x", title="x"),
            TableColumn(field="y", title="y"),
            TableColumn(field="d", title="d"),
        ], source=source)

        text_input = TextInput(css_classes=["foo"])
        text_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(column(table, text_input))

        row = get_table_row(page.driver, 2)
        row.click()

        enter_text_in_element(page.driver, row, Keys.INSERT, mod=Keys.CONTROL, click=0, enter=False)

        input_el = page.driver.find_element_by_css_selector('.foo')
        enter_text_in_element(page.driver, input_el, Keys.INSERT, mod=Keys.SHIFT, enter=False)
        enter_text_in_element(page.driver, input_el, "")

        sleep(0.5)
        results = page.results

        assert results['value'] == '1\t2\t1\tbar'

        assert page.has_no_console_errors()

    def test_single_row_copy_with_zero(self, bokeh_model_page) -> None:
        data = {'x': [1,2,3,4], 'y': [0,0,0,0], 'd': ['foo', 'bar', 'baz', 'quux']}
        source = ColumnDataSource(data)
        table = DataTable(columns=[
            TableColumn(field="x", title="x"),
            TableColumn(field="y", title="y"),
            TableColumn(field="d", title="d"),
        ], source=source)

        text_input = TextInput(css_classes=["foo"])
        text_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(column(table, text_input))

        row = get_table_row(page.driver, 2)
        row.click()

        enter_text_in_element(page.driver, row, Keys.INSERT, mod=Keys.CONTROL, click=0, enter=False)

        input_el = page.driver.find_element_by_css_selector('.foo')
        enter_text_in_element(page.driver, input_el, Keys.INSERT, mod=Keys.SHIFT, enter=False)
        enter_text_in_element(page.driver, input_el, "")

        sleep(0.5)
        results = page.results

        assert results['value'] == '1\t2\t0\tbar'

        assert page.has_no_console_errors()

    def test_multi_row_copy(self, bokeh_model_page) -> None:
        data = {'x': [1,2,3,4], 'y': [0,1,2,3], 'd': ['foo', 'bar', 'baz', 'quux']}
        source = ColumnDataSource(data)
        table = DataTable(columns=[
            TableColumn(field="x", title="x"),
            TableColumn(field="y", title="y"),
            TableColumn(field="d", title="d"),
        ], source=source)

        text_input = TextInput(css_classes=["foo"])
        text_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = bokeh_model_page(column(table, text_input))

        row = get_table_row(page.driver, 1)
        row.click()

        row = get_table_row(page.driver, 3)
        shift_click(page.driver, row)

        enter_text_in_element(page.driver, row, Keys.INSERT, mod=Keys.CONTROL, click=0, enter=False)

        input_el = page.driver.find_element_by_css_selector('.foo')
        enter_text_in_element(page.driver, input_el, Keys.INSERT, mod=Keys.SHIFT, enter=False)
        enter_text_in_element(page.driver, input_el, "")

        results = page.results

        # XXX (bev) these should be newlines with a TextAreaInput but TextAreaInput
        # is not working in tests for some reason presently
        assert results['value'] == '0\t1\t0\tfoo 1\t2\t1\tbar 2\t3\t2\tbaz'

        assert page.has_no_console_errors()
