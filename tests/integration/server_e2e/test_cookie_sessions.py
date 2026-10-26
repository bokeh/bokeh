#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import json
from urllib.error import HTTPError
from urllib.request import Request, urlopen

# External imports
import pytest
from tests.support.util.asgi import running_asgi
from websockets.exceptions import InvalidStatus
from websockets.sync.client import connect

# Bokeh imports
from bokeh.models import Div
from bokeh.server.asgi import BokehASGI
from bokeh.server.auth import AuthPolicy
from bokeh.util.token import generate_jwt_token, generate_session_id, get_token_payload


@pytest.mark.parametrize('mode', ['unsigned', 'signed', 'external-signed'])
@pytest.mark.parametrize('bootstrap', ['http', 'websocket'])
def test_cookie_context_over_real_http_and_websocket(mode, bootstrap):
    secret = b'network-cookie-signing-secret'
    signed = mode != 'unsigned'
    observed = []

    def authenticate(request):
        cookie = request.cookies.get('session')
        return 'engineer' if cookie is not None and cookie.value == 'authenticated' else None

    def modify_document(doc):
        observed.append(doc.session_context)
        doc.add_root(Div(text='Cookie context stays on the server'))

    app = BokehASGI(modify_document, sign_sessions=signed, secret_key=secret,
                   generate_session_ids=mode != 'external-signed', auth_policy=AuthPolicy(authenticate))
    session_id = generate_session_id(secret_key=secret, signed=signed)
    with running_asgi(app) as host:
        headers = {'Cookie': 'session=authenticated; theme=dark', 'Bokeh-Session-Id': session_id}
        if bootstrap == 'http':
            if mode == 'external-signed':
                with pytest.raises(HTTPError) as error:
                    urlopen(Request(host.url + '/embed.json', headers={'Cookie': headers['Cookie']}), timeout=5)
                assert error.value.code == 403
            with urlopen(Request(host.url + '/embed.json', headers=headers), timeout=5) as response:
                token = json.load(response)['token']
            payload = get_token_payload(token)
            assert payload['cookies'] == {}
            assert not any(name.lower() == 'cookie' for name in payload['headers'])
        else:
            token = generate_jwt_token(session_id, secret_key=secret, signed=signed,
                                       extra_payload={'cookies': {'session': 'forged', 'theme': 'forged'}})
        websocket_url = host.url.replace('http:', 'ws:') + '/ws'
        for preference in ['dark', 'light']:
            with connect(websocket_url, origin=host.url, subprotocols=['bokeh', token],
                         additional_headers={'Cookie': f'session=authenticated; theme={preference}'},
                         open_timeout=5) as socket:
                assert json.loads(socket.recv(timeout=5))['header']['msgtype'] == 'ACK'
            assert len(observed) == 1
            assert observed[0].request.cookies == {'session': 'authenticated', 'theme': 'dark'}
        with pytest.raises(InvalidStatus):
            connect(websocket_url, origin=host.url, subprotocols=['bokeh', token],
                    additional_headers={'Cookie': 'session=attacker'}, open_timeout=5)
        assert len(observed) == 1
