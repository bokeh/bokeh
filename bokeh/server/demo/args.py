
import argparse
import os
import sys

DEFAULT_BACKEND = os.environ.get('BOKEH_SERVER_DEFAULT_BACKEND', 'memory')

if DEFAULT_BACKEND not in ['redis', 'shelve', 'memory']:
    print("Unrecognized default backend: '%s'. Accepted values are: 'redis', 'shelve', 'memory'" % DEFAULT_BACKEND)
    sys.exit(1)

def _build_parser():
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

    general.add_argument("--script",
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
                     help="don't show 'GET /static/... 200 OK'")
    dev.add_argument("-j", "--debugjs",
                     action="store_true",
                     default=False,
                     help="serve BokehJS files from the bokehjs build directory in the source tree"
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

parser = _build_parser()
del _build_parser