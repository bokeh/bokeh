from __future__ import print_function

# NOTE: Execute patch_all() before everything else, especially before
# importing threading module. Otherwise, annoying KeyError exception
# will be thrown. gevent is optional, so don't fail if not installed.
try:
    import gevent.monkey
except ImportError:
    pass
else:
    gevent.monkey.patch_all()
from os.path import join, dirname
import argparse, os, sys
import logging
import werkzeug.serving
import imp
import sys

from bokeh.server.utils.reload import robust_reloader
from bokeh.server.app import bokeh_app
from bokeh.settings import settings

DEFAULT_BACKEND = os.environ.get('BOKEH_SERVER_DEFAULT_BACKEND', 'shelve')
if DEFAULT_BACKEND not in ['redis', 'shelve', 'memory']:
    print("Unrecognized default backend: '%s'. Accepted values are: 'redis', 'shelve', 'memory'" % DEFAULT_BACKEND)
    sys.exit(1)

def build_parser():
    parser = argparse.ArgumentParser(description="Start the Bokeh plot server")
    parser.add_argument("-d", "--debug",
                        action="store_true",
                        default=False,
                        help="debug mode for flask"
                        )
    parser.add_argument("-j", "--debugjs",
                        action="store_true",
                        default=False,
                        help="Whether to use bokehjs from the bokehjs build directory in the source tree or not"
                        )
    parser.add_argument("-s", "--splitjs",
                        action="store_true",
                        default=False,
                        help="don't serve compiled bokeh.js file.  This can only be True if debugjs is True"
                        )
    parser.add_argument("--filter-logs",
                        action="store_true",
                        default=False,
                        help="don't show GET /static/... 200 OK (useful with --splitjs)")
    parser.add_argument("-v", "--verbose", action="store_true", default=False)
    parser.add_argument("--backend",
                        help="storage backend: [ redis | memory | shelve ], default: %s" % DEFAULT_BACKEND,
                        type=str,
                        default=DEFAULT_BACKEND
                        )
    parser.add_argument("--ip",
                        help="The IP address the bokeh server will listen on",
                        type=str,
                        default="127.0.0.1"
                        )
    parser.add_argument("--bokeh-port",
                        help="port for bokeh server",
                        type=int,
                        default=5006
                        )
    parser.add_argument("--redis-port",
                        help="port for redis",
                        type=int,
                        default=7001
                        )
    parser.add_argument("--start-redis",
                        help="start redis",
                        action="store_true",
                        dest="start_redis",
                        )
    parser.add_argument("--no-start-redis",
                        help="do not start redis",
                        action="store_false",
                        dest="start_redis",
                        )
    parser.set_defaults(start_redis=True)
    parser.add_argument("-m", "--multi-user",
                        help="multi user",
                        action="store_true",
                        default=False
                        )
    parser.add_argument("-D", "--data-directory",
                        help="data directory",
                        type=str
                        )
    parser.add_argument("--robust-reload",
                        help="whether to protect debug server reloading from syntax errors",
                        default=False,
                        action="store_true",
                       )
    parser.add_argument("--script",
                        help="script to load(for applets)",
                        default=None,
                        type=str
                       )
    parser.add_argument("--url-prefix",
                        help="url prefix",
                        type=str
                        )

    class DevAction(argparse.Action):
        def __call__(self, parser, namespace, values, option_string=None):
            namespace.splitjs = True
            namespace.debugjs = True
            namespace.backend = 'memory'

    parser.add_argument("--dev", action=DevAction, nargs=0, help="run server in development mode")

    return parser
    
def run():
    parser = build_parser()
    args = parser.parse_args(sys.argv[1:])

    level = logging.DEBUG if args.debug else logging.INFO
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


    print("""
Bokeh Server Configuration
==========================
listening      : %s:%d
backend        : %s
python options : %s
js options     : %s
data-directory : %s
""" % (
    args.ip, args.bokeh_port,
    backend_options,
    py_options,
    js_options,
    None if not args.data_directory else args.data_directory,
))

    if args.filter_logs:
        class StaticFilter(logging.Filter):

            def filter(self, record):
                msg = record.getMessage()
                return not (msg.startswith(("GET /static", "GET /bokehjs/static")) and \
                            any(status in msg for status in ["200 OK", "304 NOT MODIFIED"]))

        for handler in logging.getLogger().handlers:
            handler.addFilter(StaticFilter())
    settings.debugjs = args.debugjs
    if args.debug :
        extra_files = settings.js_files() + settings.css_files()
        start_with_reloader(args, extra_files, args.robust_reload)
    else:
        start_server(args)

def start_server(args):
    from . import start
    
    bokeh_app.debug = args.debug
    bokeh_app.splitjs = args.splitjs
    bokeh_app.debugjs = args.debugjs

    backend = {
        "type": args.backend,
        "redis_port": args.redis_port,
        "start_redis": args.start_redis,
    }
    start.prepare_app(backend, single_user_mode=not args.multi_user,
                      data_directory=args.data_directory)
    if args.script:
        script_dir = dirname(args.script)
        if script_dir not in sys.path:
            print ("adding %s to python path" % script_dir)
            sys.path.append(script_dir)
        print ("importing %s" % args.script)
        imp.load_source("_bokeh_app", args.script)
    start.register_blueprint(args.url_prefix)
    start.start_app(host=args.ip, port=args.bokeh_port, verbose=args.verbose)

def start_with_reloader(args, js_files, robust):
    def helper():
        start_server(args)
    if robust:
        helper = robust_reloader(helper)
    werkzeug.serving.run_with_reloader(
        helper, extra_files=js_files)

