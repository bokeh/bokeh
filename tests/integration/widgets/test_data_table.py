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
from selenium.webdriver.common.action_chains import ActionChains

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import Button, ColumnDataSource, CustomJS, DataTable, IntEditor, NumberEditor, StringEditor, TableColumn
from bokeh._testing.util.selenium import RECORD

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

@pytest.mark.integration
@pytest.mark.selenium
class Test_DataTable_Base(object):

    def enter_text_in_cell(self, page, cell, text):
        actions = ActionChains(page.driver)
        actions.move_to_element(cell)
        actions.double_click()
        actions.send_keys(text + u"\ue007")  # After the backslash is ENTER key
        actions.perform()

    def get_cell(self, driver, row, col):
        return driver.find_element_by_css_selector('.grid-canvas .slick-row:nth-child(%d) .r%d' % (row, col))

class Test_CellEditor_Base(Test_DataTable_Base):

    def setup_method(self):
        source = ColumnDataSource({'values': self.values})
        column = TableColumn(field='values', title='values', editor=self.editor())
        self.table = DataTable(source=source, columns=[column], editable=True, width=600)

        # this is triggered on selection changes
        source.selected.js_on_change('indices', CustomJS(args=dict(s=source), code=RECORD("values", "s.data.values")))



class Test_Datatable(Test_DataTable_Base):

    def test_row_highlights_reflect_initial_selection(self, bokeh_model_page, driver, has_no_console_errors):

        source = ColumnDataSource({'values': [1, 2]})
        source.selected.indices = [1]
        column = TableColumn(field='values', title='values')
        table = DataTable(source=source, columns=[column], editable=False, width=600)

        bokeh_model_page(table)

        row0 = self.get_cell(driver, 1, 1)
        assert 'selected' not in row0.get_attribute('class')

        row1 = self.get_cell(driver, 2, 1)
        assert 'selected' in row1.get_attribute('class')

        assert has_no_console_errors(driver)

    def test_row_highlights_reflect_ui_selection(self, bokeh_model_page, driver, has_no_console_errors):

        source = ColumnDataSource({'values': [1, 2]})
        column = TableColumn(field='values', title='values')
        table = DataTable(source=source, columns=[column], editable=False, width=600)

        bokeh_model_page(table)

        row0 = self.get_cell(driver, 1, 1)
        assert 'selected' not in row0.get_attribute('class')

        row1 = self.get_cell(driver, 2, 1)
        assert 'selected' not in row1.get_attribute('class')

        cell = self.get_cell(driver, 2, 1)
        cell.click()

        row0 = self.get_cell(driver, 1, 1)
        assert 'selected' not in row0.get_attribute('class')

        row1 = self.get_cell(driver, 2, 1)
        assert 'selected' in row1.get_attribute('class')

        assert has_no_console_errors(driver)

    def test_row_highlights_reflect_js_selection(self, bokeh_model_page, driver, has_no_console_errors):

        source = ColumnDataSource({'values': [1, 2]})
        col = TableColumn(field='values', title='values')
        table = DataTable(source=source, columns=[col], editable=False, width=600)

        button = Button(label="Click")
        button.callback = CustomJS(args=dict(s=source), code="""
            s.selected.indices = [1]
        """)

        bokeh_model_page(column(button, table))

        row0 = self.get_cell(driver, 1, 1)
        assert 'selected' not in row0.get_attribute('class')

        row1 = self.get_cell(driver, 2, 1)
        assert 'selected' not in row1.get_attribute('class')

        button = driver.find_element_by_class_name('bk-bs-btn')
        button.click()

        row0 = self.get_cell(driver, 1, 1)
        assert 'selected' not in row0.get_attribute('class')

        row1 = self.get_cell(driver, 2, 1)
        assert 'selected' in row1.get_attribute('class')

        assert has_no_console_errors(driver)

# XXX Chekbox editor is currently completely broken
# class Test_CheckboxEditor(Test_CellEditor_Base):

#     values = [True, False]
#     editor = CheckboxEditor

#     def test_editing_cell_does_not_update_source_on_noneditable_table(self, bokeh_model_page, driver, has_no_console_errors):
#         self.table.editable = False
#         page = bokeh_model_page(self.table)

#         # Click row 1 (which triggers the selection callback)
#         cell = self.get_cell(driver, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text new value and <enter>
#         cell = self.get_cell(driver, 1, 1)
#         # TODO

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = self.get_cell(driver, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         assert has_no_console_errors(driver)

#     def test_editing_cell_updates_source_on_editable_table(self, bokeh_model_page, driver, has_no_console_errors):
#         page = bokeh_model_page(self.table)

#         # Click row 1 (which triggers the selection callback)
#         cell = self.get_cell(driver, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text new value and <enter>
#         cell = self.get_cell(driver, 1, 1)
#         # TODO

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = self.get_cell(driver, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == [False, False]

#         assert has_no_console_errors(driver)

class Test_IntEditor(Test_CellEditor_Base):

    values = [1, 2]
    editor = IntEditor

    def test_editing_cell_does_not_update_source_on_noneditable_table(self, bokeh_model_page, driver, has_no_console_errors):
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = self.get_cell(driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = self.get_cell(driver, 1, 1)
        self.enter_text_in_cell(page, cell, "33")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = self.get_cell(driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert has_no_console_errors(driver)

    @pytest.mark.parametrize('bad', ["1.1", "text"])
    def test_editing_cell_does_not_update_source_on_bad_values(self, bad, bokeh_model_page, driver, has_no_console_errors):
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = self.get_cell(driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = self.get_cell(driver, 1, 1)
        self.enter_text_in_cell(page, cell, bad)

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = self.get_cell(driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert has_no_console_errors(driver)

    def test_editing_cell_updates_source_on_editable_table(self, bokeh_model_page, driver, has_no_console_errors):
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = self.get_cell(driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = self.get_cell(driver, 1, 1)
        self.enter_text_in_cell(page, cell, "33")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = self.get_cell(driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == [33, 2]

        assert has_no_console_errors(driver)

class Test_NumberEditor(Test_CellEditor_Base):

    values = [1.1, 2.2]
    editor = NumberEditor

    def test_editing_cell_does_not_update_source_on_noneditable_table(self, bokeh_model_page, driver, has_no_console_errors):
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = self.get_cell(driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = self.get_cell(driver, 1, 1)
        self.enter_text_in_cell(page, cell, "33.5")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = self.get_cell(driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert has_no_console_errors(driver)

    @pytest.mark.parametrize('bad', ["text"])
    def test_editing_cell_does_not_update_source_on_bad_values(self, bad, bokeh_model_page, driver, has_no_console_errors):
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = self.get_cell(driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = self.get_cell(driver, 1, 1)
        self.enter_text_in_cell(page, cell, bad)

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = self.get_cell(driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert has_no_console_errors(driver)

    def test_editing_cell_updates_source_on_editable_table(self, bokeh_model_page, driver, has_no_console_errors):
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = self.get_cell(driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = self.get_cell(driver, 1, 1)
        self.enter_text_in_cell(page, cell, "33.5")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = self.get_cell(driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == [33.5, 2.2]

        assert has_no_console_errors(driver)

class Test_StringEditor(Test_CellEditor_Base):

    values = ["foo", "bar"]
    editor = StringEditor

    def test_editing_cell_does_not_update_source_on_noneditable_table(self, bokeh_model_page, driver, has_no_console_errors):
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = self.get_cell(driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = self.get_cell(driver, 1, 1)
        self.enter_text_in_cell(page, cell, "baz")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = self.get_cell(driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert has_no_console_errors(driver)

    @pytest.mark.parametrize('bad', ["1", "1.1", "-1"])
    def test_editing_cell_does_not_update_source_on_bad_values(self, bad, bokeh_model_page, driver, has_no_console_errors):
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = self.get_cell(driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = self.get_cell(driver, 1, 1)
        self.enter_text_in_cell(page, cell, bad)

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = self.get_cell(driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert has_no_console_errors(driver)

    def test_editing_cell_updates_source_on_editable_table(self, bokeh_model_page, driver, has_no_console_errors):
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = self.get_cell(driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = self.get_cell(driver, 1, 1)
        self.enter_text_in_cell(page, cell, "baz")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = self.get_cell(driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == ["baz", "bar"]

        assert has_no_console_errors(driver)

# XXX (bev) PercentEditor is currently completely broken
# class Test_PercentEditor(Test_CellEditor_Base):

#     values = [0.1, 0.2]
#     editor = PercentEditor

#     def test_editing_cell_does_not_update_source_on_noneditable_table(self, bokeh_model_page, driver, has_no_console_errors):
#         self.table.editable = False
#         page = bokeh_model_page(self.table)

#         # Click row 1 (which triggers the selection callback)
#         cell = self.get_cell(driver, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text 33 and <enter>
#         cell = self.get_cell(driver, 1, 1)
#         self.enter_text_in_cell(page, cell, "0.5")

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = self.get_cell(driver, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         assert has_no_console_errors(driver)

#     @pytest.mark.parametrize('bad', ["-1", "-0.5", "1.1", "2", "text"])
#     def test_editing_cell_does_not_update_source_on_bad_values(self, bad, bokeh_model_page, driver, has_no_console_errors):
#         self.table.editable = False
#         page = bokeh_model_page(self.table)

#         # Click row 1 (which triggers the selection callback)
#         cell = self.get_cell(driver, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text new value and <enter>
#         cell = self.get_cell(driver, 1, 1)
#         self.enter_text_in_cell(page, cell, bad)

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = self.get_cell(driver, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         assert has_no_console_errors(driver)

#     def test_editing_cell_updates_source_on_editable_table(self, bokeh_model_page, driver, has_no_console_errors):
#         page = bokeh_model_page(self.table)

#         # Click row 1 (which triggers the selection callback)
#         cell = self.get_cell(driver, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text 33 and <enter>
#         cell = self.get_cell(driver, 1, 1)
#         self.enter_text_in_cell(page, cell, "0.5")

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = self.get_cell(driver, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == [0.5, 0.2]

#         assert has_no_console_errors(driver)
