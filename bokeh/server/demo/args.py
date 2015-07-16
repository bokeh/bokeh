
import argparse

from ..settings import Settings

def _build_parser():
    parser = argparse.ArgumentParser(description="Start the Bokeh plot server")

    # general configuration
    general = parser.add_argument_group('General Options')
    general.add_argument("--ip",
                         help="IP address that the bokeh server will listen on (default: %s)" % Settings.IP,
                         type=str,
                         default=Settings.IP,
                         dest="IP",
                         )
    general.add_argument("--port", "--bokeh-port",
                         help="Port that the bokeh server will listen on (default: %d)" % Settings.PORT,
                         type=int,
                         default=Settings.PORT,
                         dest="PORT",
                         )
    general.add_argument("--url-prefix",
                         help="URL prefix for server. e.g. 'host:port/<prefix>/bokeh' (default: %s)" % Settings.URL_PREFIX,
                         type=str,
                         default=Settings.URL_PREFIX,
                         dest="URL_PREFIX",
                         )
    general.add_argument("--https",
                         help="If present, the server will be use HTTPS instead of HTTP (default: False).",
                         action="store_true",
                         default=False,
                         dest="HTTPS",
                         )
    general.add_argument("--https-certfile",
                         help="Required with the --https flag. Must be the filename of a valid HTTPS crt file (default: None)",
                         type=str,
                         dest="CERTFILE",
                         )
    general.add_argument("--https-keyfile",
                         help="Required with the --https flag. Must be the filename of a valid HTTPS key file (default: None)",
                         type=str,
                         dest="KEYFILE",
                         )
    general.add_argument("--secret-key",
                         help="",
                         default=Settings.SECRET_KEY,
                         type=str,
                         dest="SECRET_KEY",
                         )
    general.add_argument("--filter-logs",
                         action="store_true",
                         default=False,
                         help="don't show 'GET /static/... 200 OK' (default: False)",
                         dest="FILTER_LOGS",
                         )
    general.add_argument("--script",
                         help="script to load (for applets)",
                         default=None,
                         type=str
                         )
    # storage config
    storage = parser.add_argument_group('Storage Options')
    storage.add_argument("--backend",
                         help="storage backend: [ redis | memory | shelve ], (default: %s)" % Settings.STORAGE_BACKEND,
                         type=str,
                         default=Settings.STORAGE_BACKEND,
                         dest="STORAGE_BACKEND",
                         )
    storage.add_argument("--redis-host",
                         help="host for redis server to listen on (default: %s)" % Settings.REDIS_HOST,
                         type=str,
                         default=Settings.REDIS_HOST,
                         dest="REDIS_HOST",
                         )
    storage.add_argument("--redis-port",
                         help="port for redis server to listen on (default: %d)" % Settings.REDIS_PORT,
                         type=int,
                         default=Settings.REDIS_PORT,
                         dest="REDIS_HOST",
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
                            default=Settings.WS_CONN_STRING,
                            dest="WS_CONN_STRING",
                            )
    # dev, debugging, etc.
    class DevAction(argparse.Action):
        def __call__(self, parser, namespace, values, option_string=None):
            namespace.debug = True
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

    return parser

parser = _build_parser()
del _build_parser