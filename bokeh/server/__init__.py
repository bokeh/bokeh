from __future__ import absolute_import, print_function

import argparse, os, sys
import logging

import werkzeug.serving

from bokeh import __version__; __version__
from bokeh.server.utils.reload import robust_reloader; robust_reloader
from bokeh.server.app import bokeh_app; bokeh_app
from bokeh.settings import settings; settings

DEFAULT_BACKEND = os.environ.get('BOKEH_SERVER_DEFAULT_BACKEND', 'memory')
if DEFAULT_BACKEND not in ['redis', 'shelve', 'memory']:
    print("Unrecognized default backend: '%s'. Accepted values are: 'redis', 'shelve', 'memory'" % DEFAULT_BACKEND)
    sys.exit(1)

def build_parser():
    parser = argparse.ArgumentParser(description="Start the Bokeh plot server")

    # general configuration
    general = parser.add_argument_group('General Options')
    general.add_argument("--ip",
                         help="IP address that the bokeh server will listen on (default: 127.0.0.1)",
                         type=str,
                         default="127.0.0.1"
                         )
    general.add_argument("--port", "--bokeh-port",
                         help="Port that the bokeh server will listen on (default: 5006)",
                         type=int,
                         default=5006
                         )
    general.add_argument("--url-prefix",
                         help="URL prefix for server. e.g. 'host:port/<prefix>/bokeh' (default: None)",
                         type=str
                         )
    general.add_argument("--https",
                         help="If present, the server will be use HTTPS instead of HTTP (defualt: False).",
                         action="store_true",
                         default=False
                         )
    general.add_argument("--https-certfile",
                         help="Required with the --https flag. Must be the filename of a valid HTTPS crt file (default: None)",
                         type=str
                         )
    general.add_argument("--https-keyfile",
                         help="Required with the --https flag. Must be the filename of a valid HTTPS key file (default: None)",
                         type=str
                         )

    # advanced configuration
    advanced = parser.add_argument_group('Advanced Options')
    advanced.add_argument("-D", "--blaze-config",
                          help="blaze_config_File",
                          type=str,
                          default=None
                          )
    advanced.add_argument("-m", "--multi-user",
                          help="start in multi-user configuration (default: False)",
                          action="store_true",
                          default=False
                          )
    advanced.add_argument("--script",
                          help="script to load (for applets)",
                          default=None,
                          type=str
                          )

    # storage config
    storage = parser.add_argument_group('Storage Options')
    storage.add_argument("--backend",
                         help="storage backend: [ redis | memory | shelve ], (default: %s)" % DEFAULT_BACKEND,
                         type=str,
                         default=DEFAULT_BACKEND
                         )
    storage.add_argument("--redis-port",
                         help="port for redis server to listen on (default: 7001)",
                         type=int,
                         default=7001
                         )
    storage.add_argument("--start-redis",
                         help="start redis",
                         action="store_true",
                         dest="start_redis",
                         )
    storage.add_argument("--no-start-redis",
                         help="do not start redis",
                         action="store_false",
                         dest="start_redis",
                         )
    parser.set_defaults(start_redis=True)

    # websockets config
    websockets = parser.add_argument_group('Websocket Options')
    websockets.add_argument("--ws-conn-string",
                            help="connection string for websocket (unnecessary if auto-starting)",
                            default=None
                            )
    # dev, debugging, etc.
    class DevAction(argparse.Action):
        def __call__(self, parser, namespace, values, option_string=None):
            #namespace.splitjs = True
            namespace.debugjs = True
            namespace.backend = 'memory'

    dev = parser.add_argument_group('Development Options')
    dev.add_argument("-d", "--debug",
                     action="store_true",
                     default=False,
                     help="use debug mode for Flask"
                     )
    dev.add_argument("--dev",
                     action=DevAction,
                     nargs=0,
                     help="run server in development mode"
                     )
    dev.add_argument("--filter-logs",
                     action="store_true",
                     default=False,
                     help="don't show 'GET /static/... 200 OK', useful with --splitjs")
    dev.add_argument("-j", "--debugjs",
                     action="store_true",
                     default=False,
                     help="serve BokehJS files from the bokehjs build directory in the source tree"
                     )
    dev.add_argument("-s", "--splitjs",
                     action="store_true",
                     default=False,
                     help="serve individual JS files instead of compiled bokeh.js, requires --debugjs"
                     )
    dev.add_argument("--robust-reload",
                     help="protect debug server reloading from syntax errors",
                     default=False,
                     action="store_true",
                     )
    dev.add_argument("-v", "--verbose",
                     action="store_true",
                     default=False
                     )

    return parser

def run():
    parser = build_parser()
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
        name + ":" + onoff[vars(args).get(name)]for name in ['splitjs', 'debugjs']
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

def start_server(args):
    from . import start
    start.start_simple_server(args)

def start_with_reloader(args, js_files, robust):
    def helper():
        start_server(args)
    if robust:
        helper = robust_reloader(helper)
    werkzeug.serving.run_with_reloader(
        helper, extra_files=js_files)
