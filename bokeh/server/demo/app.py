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
from tornado import ioloop
import werkzeug.serving

from .args import parser
from . import services
from ..app import bokeh_app, app
from ..configure import configure_flask, make_tornado_app, register_blueprint
from ..settings import settings
from ..utils.reload import robust_reloader

def doc_prepare():
    settings.model_backend = {'type' : 'memory'}
    configure_flask()
    register_blueprint()
    return app

http_server = None
def start_redis():
    work_dir = getattr(bokeh_app, 'work_dir', os.getcwd())
    data_file = getattr(bokeh_app, 'data_file', 'redis.db')
    stdout = getattr(bokeh_app, 'stdout', sys.stdout)
    stderr = getattr(bokeh_app, 'stdout', sys.stderr)
    redis_save = getattr(bokeh_app, 'redis_save', True)
    mproc = services.start_redis(pidfilename=os.path.join(work_dir, "bokehpids.json"),
                                 port=bokeh_app.backend.get('redis_port', 6379),
                                 data_dir=work_dir,
                                 data_file=data_file,
                                 stdout=stdout,
                                 stderr=stderr,
                                save=redis_save)
    bokeh_app.redis_proc = mproc

server = None

def make_tornado(config_file=None):
    configure_flask(config_file=config_file)
    register_blueprint()
    tornado_app = make_tornado_app(flask_app=app)
    return tornado_app

def start_server(args=None):
    global server
    configure_flask(config_argparse=args)
    if settings.model_backend.get('start-redis', False):
        start_redis()
    register_blueprint()
    tornado_app = make_tornado_app(flask_app=app)
    if args is not None and args.https:
        if args.https_certfile and args.https_keyfile:
            server = HTTPServer(tornado_app, ssl_options={"certfile": args.https_certfile, "keyfile": args.https_keyfile})
            log.info('HTTPS Enabled')
        else:
            server = HTTPServer(tornado_app)
            log.warning('WARNING: --https-certfile or --https-keyfile are not specified, using http instead')
    else:
        server = HTTPServer(tornado_app)
    server.listen(settings.port, settings.ip)
    ioloop.IOLoop.instance().start()



def start():
    args = parser.parse_args(sys.argv[1:])

    level = logging.DEBUG if args.debug else logging.INFO
    # TODO: this does nothing - because bokeh/__init__.py is already imported
    # and basicConfig was already called
    logging.basicConfig(level=level, format="%(asctime)s:%(levelname)s:%(name)s:%(message)s")


    backend_options = args.backend
    if backend_options == 'redis':
        if args.start_redis:
            backend_options += " (start=%s, port=%d)" % (args.start_redis, args.redis_port)
        else:
            backend_options += " (start=False)"

    onoff = {True:"ON", False:"OFF"}

    py_options = ", ".join(
        name.replace('_', '-') + ":" + onoff[vars(args).get(name)] for name in ['debug', 'verbose', 'filter_logs', 'multi_user']
    )
    js_options = ", ".join(
        name + ":" + onoff[vars(args).get(name)]for name in ['debugjs']
    )

    if not args.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        print("""
    Bokeh Server Configuration
    ==========================
    python version : %s
    bokeh version  : %s
    listening      : %s:%d
    backend        : %s
    python options : %s
    js options     : %s
    """ % (
        sys.version.split()[0], __version__,
        args.ip, args.port,
        backend_options,
        py_options,
        js_options,
    ))

    settings.debugjs = args.debugjs
    start_server(args)


def start_with_reloader(args, js_files, robust):
    def helper():
        start_server(args)
    if robust:
        helper = robust_reloader(helper)
    werkzeug.serving.run_with_reloader(
        helper, extra_files=js_files)


def stop():
    if hasattr(bokeh_app, 'redis_proc'):
        bokeh_app.redis_proc.close()
    server.stop()
    bokehapp = server.request_callback
    bokehapp.stop_threads()
    ioloop.IOLoop.instance().stop()
    ioloop.IOLoop.instance().clear_instance()
