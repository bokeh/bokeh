from flask import (
    render_template, request, current_app,
    send_from_directory, make_response)
import flask
import os
import logging
import uuid
import urlparse
from ..app import app
from .. import wsmanager
log = logging.getLogger(__name__)

#web socket subscriber
@app.route('/bokeh/sub')
def sub():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']
        wsmanager.run_socket(
            ws,
            current_app.wsmanager,
            current_app.ph)
    return "done"
