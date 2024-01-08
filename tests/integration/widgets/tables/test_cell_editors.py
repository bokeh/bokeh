#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2024, Anaconda, Inc. All rights reserved.
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
from time import sleep

# Bokeh imports
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    DataTable,
    IntEditor,
    NumberEditor,
    StringEditor,
    TableColumn,
)
from tests.support.plugins.project import BokehModelPage
from tests.support.util.selenium import (
    RECORD,
    enter_text_in_cell,
    enter_text_in_cell_with_click_enter,
    escape_cell,
    get_table_cell,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)


def make_table(editor, values):
    source = ColumnDataSource({'values': values})
    column = TableColumn(field='values', title='values', editor=editor())
    table = DataTable(source=source, columns=[column], editable=True, width=600)
    # this is triggered on selection changes
    source.selected.js_on_change('indices', CustomJS(args=dict(s=source), code=RECORD("values", "s.data.values")))
    return table

# XXX Checkbox editor is currently completely broken
# @pytest.mark.selenium
# class Test_CheckboxEditor:

#     values = [True, False]
#     editor = CheckboxEditor

#     def test_editing_does_not_update_source_on_noneditable_table(self, bokeh_model_page: BokehModelPage) -> None:
#         table = make_table()
#         table.editable = False
#         page = bokeh_model_page(table)

#         # Click row 1 (which triggers the selection callback)
#         cell = get_table_cell(page.driver, table, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text new value and <enter>
#         cell = get_table_cell(page.driver, table, 1, 1)
#         # TODO

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = get_table_cell(page.driver, table, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         assert page.has_no_console_errors()

#     def test_editing_updates_source(self, bokeh_model_page: BokehModelPage) -> None:
#         table = make_table()
#         page = bokeh_model_page(table)

#         # Click row 1 (which triggers the selection callback)
#         cell = get_table_cell(page.driver, table, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text new value and <enter>
#         cell = get_table_cell(page.driver, table, 1, 1)
#         # TODO

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = get_table_cell(page.driver, table, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == [False, False]

#         assert page.has_no_console_errors()

@pytest.mark.selenium
class Test_IntEditor:

    values = [1, 2]
    editor = IntEditor

    def test_editing_does_not_update_source_on_noneditable_table(self, bokeh_model_page: BokehModelPage) -> None:
        table = make_table(self.editor, self.values)
        table.editable = False
        page = bokeh_model_page(table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, table, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        enter_text_in_cell(page.driver, table, 1, 1, "33")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, table, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert page.has_no_console_errors()

    @pytest.mark.parametrize('bad', ["1.1", "text"])
    def test_editing_does_not_update_source_on_bad_values(self, bad: str, bokeh_model_page: BokehModelPage) -> None:
        table = make_table(self.editor, self.values)
        page = bokeh_model_page(table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, table, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        enter_text_in_cell(page.driver, table, 1, 1, bad)
        escape_cell(page.driver, table, 1, 1)

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, table, 2, 1)
        cell.click()

        results = page.results
        assert results['values'] == self.values

        assert page.has_no_console_errors()

    def test_editing_updates_source(self, bokeh_model_page: BokehModelPage) -> None:
        table = make_table(self.editor, self.values)
        page = bokeh_model_page(table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, table, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        enter_text_in_cell(page.driver, table, 1, 1, "33")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, table, 2, 1)
        cell.click()
        sleep(0.5)
        results = page.results
        assert results['values'] == [33, 2]

        assert page.has_no_console_errors()

@pytest.mark.selenium
class Test_NumberEditor:

    values = [1.1, 2.2]
    editor = NumberEditor

    def test_editing_does_not_update_source_on_noneditable_table(self, bokeh_model_page: BokehModelPage) -> None:
        table = make_table(self.editor, self.values)
        table.editable = False
        page = bokeh_model_page(table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, table, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        enter_text_in_cell(page.driver, table, 1, 1, "33.5")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, table, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert page.has_no_console_errors()

    @pytest.mark.parametrize('bad', ["text"])
    def test_editing_does_not_update_source_on_bad_values(self, bad, bokeh_model_page: BokehModelPage) -> None:
        table = make_table(self.editor, self.values)
        page = bokeh_model_page(table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, table, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        enter_text_in_cell(page.driver, table, 1, 1, bad)
        escape_cell(page.driver, table, 1, 1)

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, table, 2, 1)
        cell.click()

        results = page.results
        assert results['values'] == self.values

        assert page.has_no_console_errors()

    def test_editing_updates_source(self, bokeh_model_page: BokehModelPage) -> None:
        table = make_table(self.editor, self.values)
        page = bokeh_model_page(table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, table, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        enter_text_in_cell(page.driver, table, 1, 1, "33.5")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, table, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == [33.5, 2.2]

        assert page.has_no_console_errors()

@pytest.mark.selenium
class Test_StringEditor:

    values = ["foo", "bar"]
    editor = StringEditor

    def test_editing_does_not_update_source_on_noneditable_table(self, bokeh_model_page: BokehModelPage) -> None:
        table = make_table(self.editor, self.values)
        table.editable = False
        page = bokeh_model_page(table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, table, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        enter_text_in_cell(page.driver, table, 1, 1, "baz")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, table, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        assert page.has_no_console_errors()

    # XXX: how are those bad values for a **string**?
    #@pytest.mark.parametrize('bad', ["1", "1.1", "-1"])
    #def test_editing_does_not_update_source_on_bad_values(self, bad, bokeh_model_page: BokehModelPage) -> None:
    #    table = make_table(self.editor, self.values)
    #    page = bokeh_model_page(table)

    #    # Click row 1 (which triggers the selection callback)
    #    cell = get_table_cell(page.driver, table, 1, 1)
    #    cell.click()
    #    results = page.results
    #    assert results['values'] == self.values

    #    # Now double click, enter the text new value and <enter>
    #    enter_text_in_cell(page.driver, table, 1, 1, bad)

    #    # Click row 2 (which triggers callback again so we can inspect the data)
    #    cell = get_table_cell(page.driver, table, 2, 1)
    #    cell.click()
    #    results = page.results
    #    assert results['values'] == self.values

    #    assert page.has_no_console_errors()

    def test_editing_updates_source(self, bokeh_model_page: BokehModelPage) -> None:
        table = make_table(self.editor, self.values)
        page = bokeh_model_page(table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, table, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        enter_text_in_cell(page.driver, table, 1, 1, "baz")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, table, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == ["baz", "bar"]

        assert page.has_no_console_errors()

    def test_editing_updates_source_with_click_enter(self, bokeh_model_page: BokehModelPage) -> None:
        table = make_table(self.editor, self.values)
        page = bokeh_model_page(table)

        # Click row 1 (which triggers the selection callback)
        cell = get_table_cell(page.driver, table, 1, 1)
        cell.click()
        results = page.results
        assert results['values'] == self.values

        # Now double click, enter the text new value and <enter>
        enter_text_in_cell_with_click_enter(page.driver, table, 1, 1, "baz")

        # Click row 2 (which triggers callback again so we can inspect the data)
        cell = get_table_cell(page.driver, table, 2, 1)
        cell.click()
        results = page.results
        assert results['values'] == ["baz", "bar"]

        assert page.has_no_console_errors()

# XXX (bev) PercentEditor is currently completely broken
# @pytest.mark.selenium
# class Test_PercentEditor:

#     values = [0.1, 0.2]
#     editor = PercentEditor

#     def test_editing_does_not_update_source_on_noneditable_table(self, bokeh_model_page: BokehModelPage) -> None:
#         table = make_table()
#         table.editable = False
#         page = bokeh_model_page(table)

#         # Click row 1 (which triggers the selection callback)
#         cell = get_table_cell(page.driver, table, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text 33 and <enter>
#         enter_text_in_cell(page.driver, table, 1, 1, "0.5")

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = get_table_cell(page.driver, table, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         assert page.has_no_console_errors()

#     @pytest.mark.parametrize('bad', ["-1", "-0.5", "1.1", "2", "text"])
#     def test_editing_does_not_update_source_on_bad_values(self, bad, bokeh_model_page: BokehModelPage) -> None:
#         table = make_table()
#         table.editable = False
#         page = bokeh_model_page(table)

#         # Click row 1 (which triggers the selection callback)
#         cell = get_table_cell(page.driver, table, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # Now double click, enter the text new value and <enter>
#         enter_text_in_cell(page.driver, table, 1, 1, bad)

#         # Click row 2 (which triggers callback again so we can inspect the data)
#         cell = get_table_cell(page.driver, table, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         assert page.has_no_console_errors()

#     def test_editing_updates_source(self, bokeh_model_page: BokehModelPage) -> None:
#         table = make_table()
#         page = bokeh_model_page(table)

#         # click row 1 (which triggers the selection callback)
#         cell = get_table_cell(page.driver, table, 1, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == self.values

#         # now double click, enter the text 33 and <enter>
#         enter_text_in_cell(page.driver, table, 1, 1, "0.5")

#         # click row 2 (which triggers callback again so we can inspect the data)
#         cell = get_table_cell(page.driver, table, 2, 1)
#         cell.click()
#         results = page.results
#         assert results['values'] == [0.5, 0.2]

#         assert page.has_no_console_errors()
