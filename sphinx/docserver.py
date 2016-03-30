from __future__ import print_function

import flask
import os
import threading
import time
import webbrowser

from tornado.wsgi import WSGIContainer
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop



_basedir = os.path.join("..", os.path.dirname(__file__))

app = flask.Flask(__name__, static_path="/unused")
PORT=5009
http_server = HTTPServer(WSGIContainer(app))

"""this is a simple server to facilitate developing the docs.  by
serving up static files from this server, we avoid the need to use a
symlink.

"""


@app.route('/')
def welcome():
    return """
    <h1>Welcome to the Bokeh documentation server</h1>
    You probably want to go to <a href="/en/latest/index.html"> Index</a>
    """

@app.route('/en/latest/<path:filename>')
def send_pic(filename):
    return flask.send_from_directory(
        os.path.join(_basedir,"sphinx/_build/html/"), filename)


def open_browser():
    # Child process
    time.sleep(0.5)
    webbrowser.open("http://localhost:%d/en/latest/index.html" % PORT, new="tab")

def serve_http():
    http_server.listen(PORT)
    IOLoop.instance().start()

def shutdown_server():
    ioloop = IOLoop.instance()
    ioloop.add_callback(ioloop.stop)
    print("Asked Server to shut down.")

def ui():
    time.sleep(0.5)
    input("Press any key to exit...")


if __name__ == "__main__":

    print("\nStarting Bokeh plot server on port %d..." % PORT)
    print("Visit http://localhost:%d/en/latest/index.html to see plots\n" % PORT)

    t_server = threading.Thread(target=serve_http)  
    t_server.start()
    t_browser = threading.Thread(target=open_browser)
    t_browser.start()

    ui()

    shutdown_server()
    t_server.join()
    t_browser.join()
    print("Server shut down.")
