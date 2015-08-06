#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

import os
import sys

from bokeh import __version__
from bokeh import plotting; plotting  # imports custom objects for plugin
from bokeh import models; models      # import objects so that we can resolve them
from bokeh import protocol; protocol  # import objects so that we can resolve them
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop

from . import services
from .args import parser
from ..configure import create_flask_app
from ..tornado import create_tornado_app

_server = None
_redis_proc = None

def print_configuration(app):
    storage_backend = app.config['STORAGE_BACKEND']
    if storage_backend == 'redis':
        host = app.config['REDIS_HOST']
        port = app.config['REDIS_PORT']
        storage_backend += " (host=%s, port=%d)" % (host, port)

    opts = []
    for opt in ['FILTER_LOGS', 'DEBUG', 'HTTPS', 'RUN_FORWARDER']:
        if app.config['' + opt]: opts.append(opt)

    print("""
    Bokeh Server Configuration
    ==========================
    python version  : %s
    bokeh version   : %s
    listening       : %s:%d
    storage backend : %s
    options         : %s
    """ % (
        sys.version.split()[0], __version__,
        app.config['IP'], app.config['PORT'],
        storage_backend,
        ",".join(opts),
    ))

def start():
    global _server
    global _redis_proc

    args = parser.parse_args()

    app = create_flask_app(args)
    app.debug = app.config['DEBUG']

    print_configuration(app)

    if app.config['STORAGE_BACKEND'] == 'redis' and args.start_redis:
        _redis_proc = start_redis(app)

    tornado_app = create_tornado_app(app)

    start_http_server(app, tornado_app)

def stop():
    if _redis_proc:
        _redis_proc.close()
    _server.stop()
    _server.request_callback.stop_threads()
    IOLoop.instance().stop()
    IOLoop.instance().clear_instance()


def start_http_server(flask_app, tornado_app):
    global _server

    if flask_app.config['HTTPS']:
        certfile = flask_app.config['CERTFILE']
        keyfile = flask_app.config['KEYFILE']
        if not certfile or not keyfile:
            raise RuntimeError("certfile and keyfile required with HTTPS enbaled")
        _server = HTTPServer(tornado_app, ssl_options={"certfile": certfile, "keyfile": keyfile})
        log.info('HTTPS Enabled')
    else:
        _server = HTTPServer(tornado_app)

    port = flask_app.config['PORT']
    ip = flask_app.config['IP']
    _server.listen(port, ip)

    IOLoop.instance().start()

def start_redis(app):
    return services.start_redis(
        pidfilename=os.path.join(os.getcwd(), "bokehpids.json"),
        port=app.config['REDIS_PORT'],
        data_dir=os.getcwd(),
        data_file='redis.db',
        stdout=sys.stdout,
        stderr=sys.stderr,
        save=True
    )




