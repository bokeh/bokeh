import argparse, sys

from bokeh.server import start
import logging

parser = argparse.ArgumentParser(description="Start the Bokeh plot server")
parser.add_argument("-d", "--debug", action="store_true", default=False)
parser.add_argument("-j", "--debugjs", action="store_true", default=False)
parser.add_argument("-v", "--verbose", action="store_true", default=False)
args = parser.parse_args(sys.argv[1:])

start.prepare_app()
start.prepare_local()

start.bokeh_app.debugjs = args.debugjs

if args.debug:
    start.bokeh_app.debug = True
    start.app.debug = True
    logging.basicConfig(level=logging.DEBUG)
    import werkzeug.serving
    @werkzeug.serving.run_with_reloader
    def helper():
        # Always set to verbose if in debug mode
        start.start_app(verbose=True)
    
else:
    logging.basicConfig(level=logging.INFO)
    start.start_app(verbose=args.verbose)

