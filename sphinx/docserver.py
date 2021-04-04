# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

import threading
import time
import webbrowser
from pathlib import Path

import flask
from flask import redirect, url_for
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.wsgi import WSGIContainer

from bokeh.settings import settings
from bokeh.util.tornado import fixup_windows_event_loop_policy

IOLOOP = None
PORT = 5009
SPHINX_TOP = Path(__file__).resolve().parent

app = flask.Flask(__name__, static_folder="/unused")


@app.route("/")
def root():
    return redirect(url_for("en/latest/index.html"))


@app.route("/alert.html") # type: ignore
def alert():
    return settings.docs_alert() or ""


@app.route("/versions.json")
def versions():
    return flask.send_from_directory(SPHINX_TOP, "versions.json")


@app.route("/en/latest/<path:filename>")
def docs(filename):
    return flask.send_from_directory(SPHINX_TOP / "build" / "html", filename)


def open_browser():
    webbrowser.open(f"http://localhost:{PORT}/en/latest/index.html", new=2)


def serve_http():
    global IOLOOP
    IOLOOP = IOLoop().current()
    http_server = HTTPServer(WSGIContainer(app))
    http_server.listen(PORT)
    IOLOOP.start()


if __name__ == "__main__":
    fixup_windows_event_loop_policy()

    print(f"\nStarting Bokeh plot server on port {PORT}...")
    print(f"Visit http://localhost:{PORT}/en/latest/index.html to see plots\n")

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
