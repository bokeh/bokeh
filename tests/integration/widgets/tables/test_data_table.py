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

# Bokeh imports
from bokeh._testing.util.selenium import RECORD, ButtonWrapper, get_table_cell
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, CustomJS, DataTable, TableColumn

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)


@pytest.mark.selenium
class Test_CellEditor_Base:
    def setup_method(self):
        source = ColumnDataSource({'values': self.values})
        column = TableColumn(field='values', title='values', editor=self.editor())
        self.table = DataTable(source=source, columns=[column], editable=True, width=600)

        # this is triggered on selection changes
        source.selected.js_on_change('indices', CustomJS(args=dict(s=source), code=RECORD("values", "s.data.values")))


@pytest.mark.selenium
class Test_DataTable:
    def test_row_highlights_reflect_no_initial_selection(self, bokeh_model_page) -> None:

        source = ColumnDataSource({'values': [1, 2]})
        column = TableColumn(field='values', title='values')
        table = DataTable(source=source, columns=[column], editable=False, width=600)

        page = bokeh_model_page(table)

        row0 = get_table_cell(page.driver, 1, 1)
        assert 'selected' not in row0.get_attribute('class')

        row1 = get_table_cell(page.driver, 2, 1)
        assert 'selected' not in row1.get_attribute('class')

        assert page.has_no_console_errors()

    def test_row_highlights_reflect_initial_selection(self, bokeh_model_page) -> None:

        source = ColumnDataSource({'values': [1, 2]})
        source.selected.indices = [1]
        column = TableColumn(field='values', title='values')
        table = DataTable(source=source, columns=[column], editable=False, width=600)

        page = bokeh_model_page(table)

        row0 = get_table_cell(page.driver, 1, 1)
        assert 'selected' not in row0.get_attribute('class')

        row1 = get_table_cell(page.driver, 2, 1)
        assert 'selected' in row1.get_attribute('class')

        assert page.has_no_console_errors()

    def test_row_highlights_reflect_ui_selection(self, bokeh_model_page) -> None:

        source = ColumnDataSource({'values': [1, 2]})
        column = TableColumn(field='values', title='values')
        table = DataTable(source=source, columns=[column], editable=False, width=600)

        page = bokeh_model_page(table)

        row0 = get_table_cell(page.driver, 1, 1)
        assert 'selected' not in row0.get_attribute('class')

        row1 = get_table_cell(page.driver, 2, 1)
        assert 'selected' not in row1.get_attribute('class')

        cell = get_table_cell(page.driver, 2, 1)
        cell.click()

        row0 = get_table_cell(page.driver, 1, 1)
        assert 'selected' not in row0.get_attribute('class')

        row1 = get_table_cell(page.driver, 2, 1)
        assert 'selected' in row1.get_attribute('class')

        assert page.has_no_console_errors()

    def test_row_highlights_reflect_js_selection(self, bokeh_model_page) -> None:

        source = ColumnDataSource({'values': [1, 2]})
        col = TableColumn(field='values', title='values')
        table = DataTable(source=source, columns=[col], editable=False, width=600)

        button = ButtonWrapper("Click", callback=CustomJS(args=dict(s=source), code="""
            s.selected.indices = [1]
        """))

        page = bokeh_model_page(column(button.obj, table))

        row0 = get_table_cell(page.driver, 1, 1)
        assert 'selected' not in row0.get_attribute('class')

        row1 = get_table_cell(page.driver, 2, 1)
        assert 'selected' not in row1.get_attribute('class')

        button.click(page.driver)

        row0 = get_table_cell(page.driver, 1, 1)
        assert 'selected' not in row0.get_attribute('class')

        row1 = get_table_cell(page.driver, 2, 1)
        assert 'selected' in row1.get_attribute('class')

        assert page.has_no_console_errors()
