from flask import (
    render_template, request, 
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
            app.wsmanager)
    return "done"
