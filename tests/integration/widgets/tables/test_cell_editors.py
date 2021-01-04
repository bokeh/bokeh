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
from bokeh._testing.util.selenium import (
    RECORD,
    enter_text_in_cell,
    enter_text_in_cell_with_click_enter,
    get_table_cell,
)
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    DataTable,
    IntEditor,
    NumberEditor,
    StringEditor,
    TableColumn,
)

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

# XXX Checkbox editor is currently completely broken
# class Test_CheckboxEditor(Test_CellEditor_Base):

#     values = [True, False]
#     editor = CheckboxEditor

#     def test_editing_does_not_update_source_on_noneditable_table(self, bokeh_model_page) -> None:
#         self.table.editable = False
#         page = bokeh_model_page(self.table)

#         # Click row 1 (which triggers the selection callback)
#         cell = get_table_cell(page.driver, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text new value and <enter>
#         cell = get_table_cell(page.driver, 1, 1)
#         # TODO

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = get_table_cell(page.driver, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         assert page.has_no_console_errors()

#     def test_editing_updates_source(self, bokeh_model_page) -> None:
#         page = bokeh_model_page(self.table)

#         # Click row 1 (which triggers the selection callback)
#         cell = get_table_cell(page.driver, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text new value and <enter>
#         cell = get_table_cell(page.driver, 1, 1)
#         # TODO

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = get_table_cell(page.driver, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == [False, False]

#         assert page.has_no_console_errors()

class Test_IntEditor(Test_CellEditor_Base):

    values = [1, 2]
    editor = IntEditor

    def test_editing_does_not_update_source_on_noneditable_table(self, bokeh_model_page) -> None:
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = get_table_cell(page.driver, 1, 1)
        enter_text_in_cell(page.driver, cell, "33")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert page.has_no_console_errors()

    @pytest.mark.parametrize('bad', ["1.1", "text"])
    def test_editing_does_not_update_source_on_bad_values(self, bad, bokeh_model_page) -> None:
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = get_table_cell(page.driver, 1, 1)
        enter_text_in_cell(page.driver, cell, bad)

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert page.has_no_console_errors()

    def test_editing_updates_source(self, bokeh_model_page) -> None:
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = get_table_cell(page.driver, 1, 1)
        enter_text_in_cell(page.driver, cell, "33")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == [33, 2]

        assert page.has_no_console_errors()

class Test_NumberEditor(Test_CellEditor_Base):

    values = [1.1, 2.2]
    editor = NumberEditor

    def test_editing_does_not_update_source_on_noneditable_table(self, bokeh_model_page) -> None:
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = get_table_cell(page.driver, 1, 1)
        enter_text_in_cell(page.driver, cell, "33.5")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert page.has_no_console_errors()

    @pytest.mark.parametrize('bad', ["text"])
    def test_editing_does_not_update_source_on_bad_values(self, bad, bokeh_model_page) -> None:
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = get_table_cell(page.driver, 1, 1)
        enter_text_in_cell(page.driver, cell, bad)

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert page.has_no_console_errors()

    def test_editing_updates_source(self, bokeh_model_page) -> None:
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = get_table_cell(page.driver, 1, 1)
        enter_text_in_cell(page.driver, cell, "33.5")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == [33.5, 2.2]

        assert page.has_no_console_errors()

class Test_StringEditor(Test_CellEditor_Base):

    values = ["foo", "bar"]
    editor = StringEditor

    def test_editing_does_not_update_source_on_noneditable_table(self, bokeh_model_page) -> None:
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = get_table_cell(page.driver, 1, 1)
        enter_text_in_cell(page.driver, cell, "baz")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert page.has_no_console_errors()

    @pytest.mark.parametrize('bad', ["1", "1.1", "-1"])
    def test_editing_does_not_update_source_on_bad_values(self, bad, bokeh_model_page) -> None:
        self.table.editable = False
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = get_table_cell(page.driver, 1, 1)
        enter_text_in_cell(page.driver, cell, bad)

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert page.has_no_console_errors()

    def test_editing_updates_source(self, bokeh_model_page) -> None:
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = get_table_cell(page.driver, 1, 1)
        enter_text_in_cell(page.driver, cell, "baz")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == ["baz", "bar"]

        assert page.has_no_console_errors()

    def test_editing_updates_source_with_click_enter(self, bokeh_model_page) -> None:
        page = bokeh_model_page(self.table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        cell = get_table_cell(page.driver, 1, 1)
        enter_text_in_cell_with_click_enter(page.driver, cell, "baz")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == ["baz", "bar"]

        assert page.has_no_console_errors()

# XXX (bev) PercentEditor is currently completely broken
# class Test_PercentEditor(Test_CellEditor_Base):

#     values = [0.1, 0.2]
#     editor = PercentEditor

#     def test_editing_does_not_update_source_on_noneditable_table(self, bokeh_model_page) -> None:
#         self.table.editable = False
#         page = bokeh_model_page(self.table)

#         # Click row 1 (which triggers the selection callback)
#         cell = get_table_cell(page.driver, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text 33 and <enter>
#         cell = get_table_cell(page.driver, 1, 1)
#         enter_text_in_cell(page.driver, cell, "0.5")

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = get_table_cell(page.driver, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         assert page.has_no_console_errors()

#     @pytest.mark.parametrize('bad', ["-1", "-0.5", "1.1", "2", "text"])
#     def test_editing_does_not_update_source_on_bad_values(self, bad, bokeh_model_page) -> None:
#         self.table.editable = False
#         page = bokeh_model_page(self.table)

#         # Click row 1 (which triggers the selection callback)
#         cell = get_table_cell(page.driver, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text new value and <enter>
#         cell = get_table_cell(page.driver, 1, 1)
#         enter_text_in_cell(page.driver, cell, bad)

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = get_table_cell(page.driver, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         assert page.has_no_console_errors()

#     def test_editing_updates_source(self, bokeh_model_page) -> None:
#         page = bokeh_model_page(self.table)

#         # click row 1 (which triggers the selection callback)
#         cell = get_table_cell(page.driver, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # now double click, enter the text 33 and <enter>
#         cell = get_table_cell(page.driver, 1, 1)
#         enter_text_in_cell(page.driver, cell, "0.5")

#         # click row 2 (which triggers callback again so we can inspect the data)
#         cell = get_table_cell(page.driver, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == [0.5, 0.2]

#         assert page.has_no_console_errors()
