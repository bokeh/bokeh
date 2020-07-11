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

# External imports
from flaky import flaky

# Bokeh imports
from bokeh._testing.util.selenium import (
    RECORD,
    alt_click,
    enter_text_in_cell,
    get_table_cell,
    get_table_column_cells,
    get_table_row,
    get_table_selected_rows,
    shift_click,
    sort_table_column,
)
from bokeh.layouts import column
from bokeh.models import (
    Button,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    DataTable,
    NumberEditor,
    Plot,
    Range1d,
    Rect,
    TableColumn,
    TapTool,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

def _is_cds_data_patch(evt):
    return evt['kind'] == 'ModelChanged' and evt['attr'] == 'data'

def has_cds_data_patches(msgs):
    for msg in msgs:
        if msg.msgtype == "PATCH-DOC":
            if any(_is_cds_data_patch(evt) for evt in msg.content.get('events', [])):
                return True

    return False


@pytest.mark.selenium
class Test_DataTableSource:
    @flaky(max_runs=10)
    def test_server_source_patch_does_not_duplicate_data_update_event(self, bokeh_server_page) -> None:
        def modify_doc(doc):
            data = {'x': [1,2,3,4], 'y': [10,20,30,40]}
            source = ColumnDataSource(data)

            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))

            table = DataTable(columns=[
                TableColumn(field="x"),
                TableColumn(field="y")
            ], source=source, editable=False)

            btn = Button(label="Click Me!", css_classes=["foo"])

            @btn.on_click
            def btn_click():
                source.patch({"x": [(0, 42)]})

            doc.add_root(column(plot, table, btn))

        page = bokeh_server_page(modify_doc)

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,3,4], 'y': [10,20,30,40]}}

        button = page.driver.find_element_by_class_name('foo')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [42,2,3,4], 'y': [10,20,30,40]}}

        # if the server receives something back like:
        #
        # Message 'PATCH-DOC' (revision 1) content: {
        #     'events': [{
        #         'kind': 'ModelChanged',
        #         'model': {'id': '1001'},
        #         'attr': 'data', 'new': {'x': [42, 2, 3, 4], 'y': [10, 20, 30, 40]}
        #     }],
        #     'references': []
        # }
        #
        # Then that means the client got our patch message and erroneously ping
        # ponged a full data update back to us
        assert not has_cds_data_patches(page.message_test_port.received)

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_source_stream_does_not_duplicate_data_update_event(self, bokeh_server_page) -> None:
        def modify_doc(doc):
            data = {'x': [1,2,3,4], 'y': [10,20,30,40]}
            source = ColumnDataSource(data)

            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))

            table = DataTable(columns=[
                TableColumn(field="x"),
                TableColumn(field="y")
            ], source=source, editable=False)

            btn = Button(label="Click Me!", css_classes=["foo"])

            @btn.on_click
            def btn_click():
                source.stream({"x": [5], "y": [50]})

            doc.add_root(column(plot, table, btn))

        page = bokeh_server_page(modify_doc)

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,3,4], 'y': [10,20,30,40]}}

        button = page.driver.find_element_by_class_name('foo')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,3,4,5], 'y': [10,20,30,40,50]}}

        # if the server receives something back like:
        #
        # Message 'PATCH-DOC' (revision 1) content: {
        #     'events': [{
        #         'kind': 'ModelChanged',
        #         'model': {'id': '1001'},
        #         'attr': 'data', 'new': {'x': [1, 2, 3, 4, 5], 'y': [10, 20, 30, 40, 50]}
        #     }],
        #     'references': []
        # }
        #
        # Then that means the client got our stream message and erroneously ping
        # ponged a full data update back to us
        assert not has_cds_data_patches(page.message_test_port.received)

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_source_update_does_not_duplicate_data_update_event(self, bokeh_server_page) -> None:
        def modify_doc(doc):
            data = {'x': [1,2,3,4], 'y': [10,20,30,40]}
            source = ColumnDataSource(data)

            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))

            table = DataTable(columns=[
                TableColumn(field="x"),
                TableColumn(field="y")
            ], source=source, editable=False)

            btn = Button(label="Click Me!", css_classes=["foo"])

            @btn.on_click
            def btn_click():
                source.data = {'x': [5,6,7,8], 'y': [50,60,70,80]}

            doc.add_root(column(plot, table, btn))

        page = bokeh_server_page(modify_doc)

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,3,4], 'y': [10,20,30,40]}}

        button = page.driver.find_element_by_class_name('foo')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [5,6,7,8], 'y': [50,60,70,80]}}

        # if the server receives something back like:
        #
        # Message 'PATCH-DOC' (revision 1) content: {
        #     'events': [{
        #         'kind': 'ModelChanged',
        #         'model': {'id': '1001'},
        #         'attr': 'data', 'new': {'x': [1, 2, 3, 4, 5], 'y': [10, 20, 30, 40, 50]}
        #     }],
        #     'references': []
        # }
        #
        # Then that means the client got our stream message and erroneously ping
        # ponged a full data update back to us
        assert not has_cds_data_patches(page.message_test_port.received)

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_edit_does_not_duplicate_data_update_event(self, bokeh_server_page) -> None:
        def modify_doc(doc):
            data = {'x': [1,2,3,4], 'y': [10,20,30,40]}
            source = ColumnDataSource(data)

            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))

            table = DataTable(columns=[
                TableColumn(field="x"),
                TableColumn(field="y", editor=NumberEditor())
            ], source=source, editable=True)

            doc.add_root(column(plot, table))

        page = bokeh_server_page(modify_doc)

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,3,4], 'y': [10,20,30,40]}}

        cell = get_table_cell(page.driver, 3, 2)
        assert cell.text == '30'
        enter_text_in_cell(page.driver, cell, '100')

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,3,4], 'y': [10, 20, 100, 40]}}

        # if the server receives something back like:
        #
        # Message 'PATCH-DOC' (revision 1) content: {
        #     'events': [{
        #         'kind': 'ModelChanged',
        #         'model': {'id': '1001'},
        #         'attr': 'data', 'new': {'x': [1,2,3,4], 'y': [10, 20, 100, 40]}
        #     }],
        #     'references': []
        # }
        #
        # Then that means the client got our stream message and erroneously ping
        # ponged a full data update back to us
        assert not has_cds_data_patches(page.message_test_port.received)

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_basic_selection(self, bokeh_server_page) -> None:
        data = {'x': [1,2,3,4,5,6], 'y': [60,50,40,30,20,10]}
        source = ColumnDataSource(data)

        def modify_doc(doc):

            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("indices", "s.selected.indices"))))

            table = DataTable(columns=[
                TableColumn(field="x"),
                TableColumn(field="y")
            ], source=source, editable=False)

            doc.add_root(column(plot, table))

        page = bokeh_server_page(modify_doc)

        page.click_custom_action()

        results = page.results
        assert results ==  {'indices': []}
        assert set(source.selected.indices) == set()
        assert get_table_selected_rows(page.driver) == set()

        # select the third row
        row = get_table_row(page.driver, 3)
        row.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'indices': [2]}
        assert source.selected.indices == [2]
        assert get_table_selected_rows(page.driver) == {2}

        # select the first row
        row = get_table_row(page.driver, 1)
        row.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'indices': [0]}
        assert source.selected.indices == [0]
        assert get_table_selected_rows(page.driver) == {0}

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_basic_mulitselection(self, bokeh_server_page) -> None:
        data = {'x': [1,2,3,4,5,6], 'y': [60,50,40,30,20,10]}
        source = ColumnDataSource(data)

        def modify_doc(doc):

            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("indices", "s.selected.indices"))))

            table = DataTable(columns=[
                TableColumn(field="x"),
                TableColumn(field="y")
            ], source=source, editable=False)

            doc.add_root(column(plot, table))

        page = bokeh_server_page(modify_doc)

        page.click_custom_action()

        results = page.results
        assert results ==  {'indices': []}
        assert set(source.selected.indices) == set()
        assert get_table_selected_rows(page.driver) == set()

        # select the third row
        row = get_table_row(page.driver, 2)
        row.click()

        row = get_table_row(page.driver, 4)
        shift_click(page.driver, row)

        page.click_custom_action()

        results = page.results
        assert set(results["indices"]) == {1, 2, 3}
        assert set(source.selected.indices) == {1, 2, 3}
        assert get_table_selected_rows(page.driver) == {1, 2, 3}

        row = get_table_row(page.driver, 6)
        alt_click(page.driver, row)

        page.click_custom_action()

        results = page.results
        assert set(results["indices"]) == {1, 2, 3, 5}
        assert set(source.selected.indices) == {1, 2, 3, 5}
        assert get_table_selected_rows(page.driver) == {1, 2, 3, 5}

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_sorted_after_data_update(self, bokeh_server_page) -> None:
        data = {'x': [1,2,5,6], 'y': [60,50,20,10]}
        source = ColumnDataSource(data)

        def modify_doc(doc):

            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))

            table = DataTable(columns=[
                TableColumn(field="x", title="x", sortable=True),
                TableColumn(field="y", title="y", sortable=True)
            ], source=source, editable=False)

            button = Button(css_classes=["foo"])
            def cb():
                source.data =  {'x': [0,1,2,3,4,5,6,7], 'y': [70,60,50,40,30,20,10,0]}
            button.on_click(cb)

            doc.add_root(column(plot, table, button))

        page = bokeh_server_page(modify_doc)

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,5,6], 'y': [60,50,20,10]}}

        assert get_table_column_cells(page.driver, 1) == ['1', '2', '5', '6']
        assert get_table_column_cells(page.driver, 2) == ['60', '50', '20', '10']

        sort_table_column(page.driver, 1)

        assert get_table_column_cells(page.driver, 1) == ['1', '2', '5', '6']
        assert get_table_column_cells(page.driver, 2) == ['60', '50', '20', '10']

        sort_table_column(page.driver, 2, True)

        assert get_table_column_cells(page.driver, 1) == ['6', '5', '2', '1']
        assert get_table_column_cells(page.driver, 2) == ['10', '20', '50', '60']

        button = page.driver.find_element_by_class_name('foo')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [0,1,2,3,4,5,6,7], 'y': [70,60,50,40,30,20,10,0]}}
        assert source.data == {'x': [0,1,2,3,4,5,6,7], 'y': [70,60,50,40,30,20,10,0]}

        assert get_table_column_cells(page.driver, 1) == ['7', '6', '5', '4', '3', '2', '1', '0']
        assert get_table_column_cells(page.driver, 2) == ['0', '10', '20', '30', '40', '50', '60', '70']

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    @pytest.mark.skip
    @flaky(max_runs=10)
    def test_server_sorted_after_patch(self, bokeh_server_page) -> None:
        data = {'x': [1,2,5,6], 'y': [60,50,20,10]}
        source = ColumnDataSource(data)

        def modify_doc(doc):

            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))

            table = DataTable(columns=[
                TableColumn(field="x", title="x", sortable=True),
                TableColumn(field="y", title="y", sortable=True)
            ], source=source, editable=False)

            button = Button(css_classes=["foo"])
            def cb():
                source.patch({'y': [[2, 100]]})
            button.on_click(cb)

            doc.add_root(column(plot, table, button))

        page = bokeh_server_page(modify_doc)

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,5,6], 'y': [60,50,20,10]}}

        assert get_table_column_cells(page.driver, 1) == ['1', '2', '5', '6']
        assert get_table_column_cells(page.driver, 2) == ['60', '50', '20', '10']

        sort_table_column(page.driver, 1)

        assert get_table_column_cells(page.driver, 1) == ['1', '2', '5', '6']
        assert get_table_column_cells(page.driver, 2) == ['60', '50', '20', '10']

        sort_table_column(page.driver, 2, True)

        assert get_table_column_cells(page.driver, 1) == ['6', '5', '2', '1']
        assert get_table_column_cells(page.driver, 2) == ['10', '20', '50', '60']

        button = page.driver.find_element_by_class_name('foo')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,5,6], 'y': [60,50,100,10]}}
        assert source.data == {'x': [1,2,5,6], 'y': [60,50,100,10]}

        assert get_table_column_cells(page.driver, 1) == ['6', '2', '1', '5']
        assert get_table_column_cells(page.driver, 2) == ['10', '50', '60', '100']

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    @pytest.mark.skip
    @flaky(max_runs=10)
    def test_server_sorted_after_stream(self, bokeh_server_page) -> None:
        data = {'x': [1,2,5,6], 'y': [60,50,20,10]}
        source = ColumnDataSource(data)

        def modify_doc(doc):

            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))

            table = DataTable(columns=[
                TableColumn(field="x", title="x", sortable=True),
                TableColumn(field="y", title="y", sortable=True)
            ], source=source, editable=False)

            button = Button(css_classes=["foo"])
            def cb():
                source.stream({'x': [100], 'y': [100]})
            button.on_click(cb)

            doc.add_root(column(plot, table, button))

        page = bokeh_server_page(modify_doc)

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,5,6], 'y': [60,50,20,10]}}

        assert get_table_column_cells(page.driver, 1) == ['1', '2', '5', '6']
        assert get_table_column_cells(page.driver, 2) == ['60', '50', '20', '10']

        sort_table_column(page.driver, 1)

        assert get_table_column_cells(page.driver, 1) == ['1', '2', '5', '6']
        assert get_table_column_cells(page.driver, 2) == ['60', '50', '20', '10']

        sort_table_column(page.driver, 2, True)

        assert get_table_column_cells(page.driver, 1) == ['6', '5', '2', '1']
        assert get_table_column_cells(page.driver, 2) == ['10', '20', '50', '60']

        button = page.driver.find_element_by_class_name('foo')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,5,6,100], 'y': [60,50,20,10,100]}}
        assert source.data == {'x': [1,2,5,6,100], 'y': [60,50,20,10,100]}

        assert get_table_column_cells(page.driver, 1) == ['6', '5', '2', '1', '100']
        assert get_table_column_cells(page.driver, 2) == ['10', '20', '50', '60', '100']

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    @pytest.mark.skip
    @flaky(max_runs=10)
    def test_server_sorted_after_edit(self, bokeh_server_page) -> None:
        data = {'x': [1,2,5,6], 'y': [60,50,20,10]}
        source = ColumnDataSource(data)

        def modify_doc(doc):

            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))

            table = DataTable(columns=[
                TableColumn(field="x", title="x", sortable=True),
                TableColumn(field="y", title="y", sortable=True, editor=NumberEditor())
            ], source=source, editable=True)

            doc.add_root(column(plot, table))

        page = bokeh_server_page(modify_doc)

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,5,6], 'y': [60,50,20,10]}}

        assert get_table_column_cells(page.driver, 1) == ['1', '2', '5', '6']
        assert get_table_column_cells(page.driver, 2) == ['60', '50', '20', '10']

        sort_table_column(page.driver, 1)

        assert get_table_column_cells(page.driver, 1) == ['1', '2', '5', '6']
        assert get_table_column_cells(page.driver, 2) == ['60', '50', '20', '10']

        sort_table_column(page.driver, 2, True)

        assert get_table_column_cells(page.driver, 1) == ['6', '5', '2', '1']
        assert get_table_column_cells(page.driver, 2) == ['10', '20', '50', '60']

        cell = get_table_cell(page.driver, 3, 2)
        assert cell.text == '50'
        enter_text_in_cell(page.driver, cell, '100')

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,5,6], 'y': [60,100,20,10]}}
        assert source.data == {'x': [1,2,5,6], 'y': [60,100,20,10]}

        assert get_table_column_cells(page.driver, 1) == ['6', '5', '1', '2']
        assert get_table_column_cells(page.driver, 2) == ['10', '20', '60', '100']

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_source_updated_after_edit(self, bokeh_server_page) -> None:
        data = {'x': [1,2,5,6], 'y': [60,50,20,10]}
        source = ColumnDataSource(data)

        def modify_doc(doc):

            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=RECORD("data", "s.data"))))

            table = DataTable(columns=[
                TableColumn(field="x", title="x", sortable=True),
                TableColumn(field="y", title="y", sortable=True, editor=NumberEditor())
            ], source=source, editable=True)

            doc.add_root(column(plot, table))

        page = bokeh_server_page(modify_doc)

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,5,6], 'y': [60,50,20,10]}}

        assert get_table_column_cells(page.driver, 1) == ['1', '2', '5', '6']
        assert get_table_column_cells(page.driver, 2) == ['60', '50', '20', '10']

        cell = get_table_cell(page.driver, 3, 2)
        assert cell.text == '20'
        enter_text_in_cell(page.driver, cell, '100')

        page.click_custom_action()

        results = page.results
        assert results ==  {'data': {'x': [1,2,5,6], 'y': [60,50,100,10]}}
        assert source.data == {'x': [1,2,5,6], 'y': [60,50,100,10]}

        assert get_table_column_cells(page.driver, 1) == ['1', '2', '5', '6']
        assert get_table_column_cells(page.driver, 2) == ['60', '50', '100', '10']

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_server_source_callback_triggered_after_edit(self, bokeh_server_page) -> None:
        data = {'x': [1,2,5,6], 'y': [60,50,20,10]}
        source = ColumnDataSource(data)

        result = []

        def modify_doc(doc):
            plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)

            table = DataTable(columns=[
                TableColumn(field="x", title="x", sortable=True),
                TableColumn(field="y", title="y", sortable=True, editor=NumberEditor())
            ], source=source, editable=True)

            def cb(attr, old, new):
                result.append("CALLED")

            source.on_change('data', cb)
            doc.add_root(column(plot, table))

        page = bokeh_server_page(modify_doc)

        assert result == []

        cell = get_table_cell(page.driver, 3, 2)
        assert cell.text == '20'
        enter_text_in_cell(page.driver, cell, '100')

        assert result == ["CALLED"]

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_glyph_selection_updates_table(self, single_plot_page) -> None:
        plot = Plot(height=800, width=1000)

        data = {'x': [1,2,3,4], 'y': [1, 1, 1, 1]}
        source = ColumnDataSource(data)
        table = DataTable(columns=[
            TableColumn(field="x", title="x", sortable=True),
            TableColumn(field="y", title="y", sortable=True, editor=NumberEditor())
        ], source=source, editable=True)

        plot.add_glyph(source, Rect(x='x', y='y', width=1.5, height=1))
        plot.add_tools(TapTool(callback=CustomJS(code=RECORD("indices", "cb_data.source.selected.indices"))))

        page = single_plot_page(column(plot, table))

        page.click_canvas_at_position(500, 400)
        assert set(page.results["indices"]) == {1, 2}

        assert get_table_selected_rows(page.driver) == {1, 2}

        assert page.has_no_console_errors()

        assert page.has_no_console_errors()
