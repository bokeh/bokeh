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
from time import sleep

# External imports
from selenium.webdriver.common.keys import Keys

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, CustomJS, DataTable, Plot, TableColumn, TextInput
from bokeh._testing.util.selenium import enter_text_in_element, get_table_row, RECORD

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

@pytest.mark.integration
@pytest.mark.selenium
class Test_DataTableCopyPaste(object):

    def test_single_row_copy(self, single_plot_page):
        plot = Plot(height=100, width=100)

        data = {'x': [1,2,3,4], 'y': [1, 1, 1, 1], 'd': ['foo', 'bar', 'baz', 'quux']}
        source = ColumnDataSource(data)
        table = DataTable(columns=[
            TableColumn(field="x", title="x"),
            TableColumn(field="y", title="y"),
            TableColumn(field="d", title="d"),
        ], source=source)

        text_input = TextInput(css_classes=["foo"])
        text_input.js_on_change('value', CustomJS(code=RECORD("value", "cb_obj.value")))

        page = single_plot_page(column(plot, table, text_input))

        # select the third row
        row = get_table_row(page.driver, 2)
        row.click()

        enter_text_in_element(page.driver, row, Keys.INSERT, mod=Keys.CONTROL, click=0, enter=False)

        input_el = page.driver.find_element_by_css_selector('.foo')
        enter_text_in_element(page.driver, input_el, Keys.INSERT, mod=Keys.SHIFT, enter=False)
        sleep(1)
        enter_text_in_element(page.driver, input_el, "")

        results = page.results

        assert results['value'] == '1\t2\t1\tbar'

        assert page.has_no_console_errors()
