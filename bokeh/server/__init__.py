# NOTE: Execute patch_all() before everything else, especially before
# importing threading module. Otherwise, annoying KeyError exception
# will be thrown. gevent is optional, so don't fail if not installed.
try:
    import gevent.monkey
except ImportError:
    pass
else:
    gevent.monkey.patch_all()

import argparse, sys
import logging

DEFAULT_BACKEND = 'redis'
if 'win32' in sys.platform:
    DEFAULT_BACKEND = 'memory'

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
    parser.add_argument("-r", "--start-redis",
                        help="start redis",
                        action="store_false",
                        default=True
                        )
    parser.add_argument("-m", "--multi-user",
                        help="multi user",
                        action="store_true",
                        default=False
                        )
    parser.add_argument("-D", "--data-directory",
                        help="data directory",
                        type=str
                        )
    return parser

def run():
    parser = build_parser()
    args = parser.parse_args(sys.argv[1:])

    level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(level=level, format="%(asctime)s:%(levelname)s:%(name)s:%(message)s")

    from . import start

    start.bokeh_app.debug = False
    start.app.debug = False
    start.bokeh_app.splitjs = args.splitjs
    start.bokeh_app.debugjs = args.debugjs

    backend = {
        "type": args.backend,
        "redis_port": args.redis_port,
        "start_redis": args.start_redis,
    }

    start.prepare_app(backend, single_user_mode=not args.multi_user,
                      data_directory=args.data_directory)
    start.register_blueprint()
    if args.debug:
        start.bokeh_app.debug = True

        import werkzeug.serving
        @werkzeug.serving.run_with_reloader
        def helper():
            start.start_app(host=args.ip, port=args.bokeh_port, verbose=True)
    else:
        start.start_app(host=args.ip, port=args.bokeh_port, verbose=args.verbose)
