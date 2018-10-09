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

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import Button, ColumnDataSource, CustomAction, CustomJS, DataTable, Plot, Range1d, TableColumn
from bokeh._testing.util.selenium import alt_click, get_table_selected_rows, get_table_row, RECORD, shift_click

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

def is_cds_data_patch(evt):
    return evt['kind'] == 'ModelChanged' and evt['model']['type'] == 'ColumnDataSource' and evt['attr'] == 'data'

@pytest.mark.integration
@pytest.mark.selenium
class Test_DataTableSource(object):

    def test_server_patch_does_not_duplicate_patch_event(self, bokeh_server_page):
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
        #         'model': {'type': 'ColumnDataSource', 'id': '1001'},
        #         'attr': 'data', 'new': {'x': [42, 2, 3, 4], 'y': [10, 20, 30, 40]}
        #     }],
        #     'references': []
        # }
        #
        # Then that means the client got our patch message and erroneously ping
        # ponged a full data update back to us
        for msg in page.message_test_port.received:
            assert not any(is_cds_data_patch(evt) for evt in msg.content.get('events', []))

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_server_patch_does_not_duplicate_stream_event(self, bokeh_server_page):
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
        #         'model': {'type': 'ColumnDataSource', 'id': '1001'},
        #         'attr': 'data', 'new': {'x': [1, 2, 3, 4, 5], 'y': [10, 20, 30, 40, 50]}
        #     }],
        #     'references': []
        # }
        #
        # Then that means the client got our stream message and erroneously ping
        # ponged a full data update back to us
        for msg in page.message_test_port.received:
            assert not any(is_cds_data_patch(evt) for evt in msg.content.get('events', []))

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_server_patch_does_not_duplicate_update_event(self, bokeh_server_page):
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
        #         'model': {'type': 'ColumnDataSource', 'id': '1001'},
        #         'attr': 'data', 'new': {'x': [1, 2, 3, 4, 5], 'y': [10, 20, 30, 40, 50]}
        #     }],
        #     'references': []
        # }
        #
        # Then that means the client got our stream message and erroneously ping
        # ponged a full data update back to us
        for msg in page.message_test_port.received:
            assert not any(is_cds_data_patch(evt) for evt in msg.content.get('events', []))

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_server_basic_selection(self, bokeh_server_page):
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

        # select the third row
        row = get_table_row(page.driver, 3)
        row.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'indices': [2]}
        assert source.selected.indices == [2]
        assert get_table_selected_rows(page.driver) == set([2])

        # select the first row
        row = get_table_row(page.driver, 1)
        row.click()

        page.click_custom_action()

        results = page.results
        assert results ==  {'indices': [0]}
        assert source.selected.indices == [0]
        assert get_table_selected_rows(page.driver) == set([0])

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()

    def test_server_basic_mulitselection(self, bokeh_server_page):
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

        # select the third row
        row = get_table_row(page.driver, 2)
        row.click()

        row = get_table_row(page.driver, 4)
        shift_click(page.driver, row)

        page.click_custom_action()

        results = page.results
        assert set(results['indices']) ==  set([1, 2, 3])
        assert set(source.selected.indices) == set([1, 2, 3])
        assert get_table_selected_rows(page.driver) == set([1, 2, 3])

        row = get_table_row(page.driver, 6)
        alt_click(page.driver, row)

        page.click_custom_action()

        results = page.results
        assert set(results['indices']) ==  set([1, 2, 3, 5])
        assert set(source.selected.indices) == set([1, 2, 3, 5])
        assert get_table_selected_rows(page.driver) == set([1, 2, 3, 5])

        # XXX (bev) disabled until https://github.com/bokeh/bokeh/issues/7970 is resolved
        #assert page.has_no_console_errors()
