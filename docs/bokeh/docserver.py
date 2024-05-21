# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Basic webserver for developing Bokeh documentation locally.

Executing this script will automatically open a browser tab to the locally
built documentation index page.

This script can be run manually:

    python docserver.py

or more commonly via executing ``make serve`` in this directory. It is possible
to combine this usage with other make targets in a single invocation, e.g.

    make clean html serve

will clean any previous docs output, build all the documentation from scratch,
and then run this script to serve and display the results.

For more information about building Bokeh's documentation, see the Developer's
Guide:

    https://docs.bokeh.org/en/latest/docs/dev_guide.html

"""

import threading
import time
import webbrowser
from pathlib import Path

import flask
from flask import redirect
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.wsgi import WSGIContainer

from bokeh.util.tornado import fixup_windows_event_loop_policy

IOLOOP = None
HOST = "localhost"
PORT = 5009
VISIT_URL = f"http://{HOST}:{PORT}/en/latest/index.html"
SPHINX_TOP = Path(__file__).resolve().parent

app = flask.Flask(__name__, static_folder="/unused")


@app.route("/")
def root():
    return redirect("en/latest/index.html")


@app.route("/en/switcher.json")
def switcher():
    return flask.send_from_directory(SPHINX_TOP, "switcher.json")


@app.route("/en/latest/<path:filename>")
def docs(filename):
    return flask.send_from_directory(SPHINX_TOP / "build" / "html", filename)


def open_browser():
    webbrowser.open(VISIT_URL, new=2)


def serve_http():
    global IOLOOP
    IOLOOP = IOLoop().current()
    http_server = HTTPServer(WSGIContainer(app))
    http_server.listen(PORT)
    IOLOOP.start()


if __name__ == "__main__":
    fixup_windows_event_loop_policy()

    print(f"\nStarting Bokeh plot server on port {PORT}...")
    print(f"Visit {VISIT_URL} to see plots\n")

    server = threading.Thread(target=serve_http)
    server.start()

    time.sleep(0.5)

    browser = threading.Thread(target=open_browser)
    browser.start()

    try:
        input("Press <ENTER> to exit...\n")  # lgtm [py/use-of-input]
    except KeyboardInterrupt:
        pass

    IOLOOP.add_callback(IOLOOP.stop)  # type: ignore
    server.join()
    browser.join()

    print("Server shut down.")
