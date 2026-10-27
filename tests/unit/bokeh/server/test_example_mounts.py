#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import importlib
from collections import deque

import pytest

from bokeh.util.token import generate_jwt_token, generate_session_id


@pytest.mark.parametrize('host', ['hosting.embed_without_a_framework', 'frameworks.embed_in_django'])
@pytest.mark.parametrize('full_path', [False, True])
async def test_example_routes_bokeh_under_outer_mount(host, full_path):
    if host.endswith('embed_in_django'):
        pytest.importorskip('django')
    module = importlib.import_module(f'examples.server.module_apps.{host}.server')
    root = '/proxy'

    async def request(path, *, websocket=False):
        events = deque([{'type': 'websocket.connect'}, {'type': 'websocket.disconnect', 'code': 1000}])
        sent = []

        async def receive():
            return events.popleft()

        async def send(event):
            sent.append(event)

        await module.app({
            'type': 'websocket' if websocket else 'http',
            'method': 'GET', 'scheme': 'http', 'http_version': '1.1',
            'path': root + path if full_path else path, 'root_path': root,
            'query_string': b'', 'headers': [(b'host', b'localhost')],
            'subprotocols': ['bokeh', generate_jwt_token(generate_session_id())],
        }, receive, send)
        return sent

    try:
        page = await request('/bkapp/')
        assert page[0]['status'] == 200
        assert b'/proxy/bkapp/static/js/bokeh' in page[1]['body']
        metadata = await request('/bkapp/metadata')
        assert metadata[0]['status'] == 200
        bootstrap = await request('/bkapp/embed.json')
        assert bootstrap[0]['status'] == 200
        assert b'"token"' in bootstrap[1]['body']
        socket = await request('/bkapp/ws', websocket=True)
        assert socket[0]['type'] == 'websocket.accept'
        assert any(event['type'] == 'websocket.send' for event in socket)
        assert not module.bokeh_application.core._clients
        if host.startswith('hosting.'):
            index = await request('/')
            assert index[0]['status'] == 200
            assert b'"url":"/proxy/bkapp"' in index[1]['body']
    finally:
        await module.bokeh_application.core.stop()
