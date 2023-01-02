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

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import (
    Button,
    ColumnDataSource,
    CustomJS,
    Plot,
    Range1d,
)
from tests.support.plugins.project import BokehServerPage
from tests.support.util.selenium import RECORD, find_element_for

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

def is_cds_data_changed(evt):
    return evt['kind'] == 'ModelChanged' and evt['attr'] == 'data'

def is_cds_data_patched(evt):
    return evt['kind'] == 'ColumnsPatched'

def is_cds_data_streamed(evt):
    return evt['kind'] == 'ColumnsStreamed'



@pytest.mark.selenium
class Test_ColumnDataSource:
    def test_client_source_patch_sends_patch_event(self, bokeh_server_page: BokehServerPage) -> None:
        data = {'x': [1,2,3,4], 'y': [10,20,30,40]}
        source = ColumnDataSource(data)
        button = Button()

        def modify_doc(doc):
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))

            button.js_on_event('button_click', CustomJS(args=dict(s=source), code="s.patch({'x': [[1, 100]]})"))
            doc.add_root(column(button, plot))

        page = bokeh_server_page(modify_doc)

        page.eval_custom_action()
        results = page.results

        assert results ==  {'data': {'x': [1,2,3,4], 'y': [10,20,30,40]}}
        assert source.data == {'x': [1,2,3,4], 'y': [10,20,30,40]}

        button_el = find_element_for(page.driver, button)
        button_el.click()

        page.eval_custom_action()
        results = page.results

        assert results ==  {'data': {'x': [1,100,3,4], 'y': [10,20,30,40]}}
        assert source.data == {'x': [1,100,3,4], 'y': [10,20,30,40]}

        # confirm patch received but no full update
        patch_events = 0
        for msg in page.message_test_port.received:
            evts = msg.content.get('events', [])
            assert not any(is_cds_data_changed(evt) for evt in evts)
            patch_events += sum(is_cds_data_patched(evt) for evt in evts)
        assert patch_events == 1

        # confirm no ping-pong
        for msg in page.message_test_port.sent:
            evts = msg.content.get('events', [])
            assert not any(is_cds_data_patched(evt) for evt in evts)

        assert page.has_no_console_errors()

    def test_client_source_stream_sends_patch_event(self, bokeh_server_page: BokehServerPage) -> None:
        data = {'x': [1,2,3,4], 'y': [10,20,30,40]}
        source = ColumnDataSource(data)
        button = Button()

        def modify_doc(doc):
            plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
            plot.tags.append(CustomJS(name="custom-action", args=dict(s=source), code=RECORD("data", "s.data")))

            button.js_on_event('button_click', CustomJS(args=dict(s=source), code="s.stream({'x': [100], 'y': [200]})"))
            doc.add_root(column(button, plot))

        page = bokeh_server_page(modify_doc)

        page.eval_custom_action()
        results = page.results

        assert results ==  {'data': {'x': [1,2,3,4], 'y': [10,20,30,40]}}
        assert source.data == {'x': [1,2,3,4], 'y': [10,20,30,40]}

        button_el = find_element_for(page.driver, button)
        button_el.click()

        page.eval_custom_action()
        results = page.results

        assert results ==  {'data': {'x': [1,2,3,4,100], 'y': [10,20,30,40,200]}}
        assert source.data == {'x': [1,2,3,4,100], 'y': [10,20,30,40,200]}

        # confirm stream received but no full update
        stream_events = 0
        for msg in page.message_test_port.received:
            evts = msg.content.get('events', [])
            assert not any(is_cds_data_changed(evt) for evt in evts)
            stream_events += sum(is_cds_data_streamed(evt) for evt in evts)
        assert stream_events == 1

        # confirm no ping-pong
        for msg in page.message_test_port.sent:
            evts = msg.content.get('events', [])
            assert not any(is_cds_data_streamed(evt) for evt in evts)

        assert page.has_no_console_errors()
