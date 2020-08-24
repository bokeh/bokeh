import asyncio
import os
import sys
import threading
import time
import webbrowser

import flask
import tornado
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.wsgi import WSGIContainer

# Needed for Windows + Python 3.8 config
if sys.version_info.major==3 and sys.version_info.minor >= 8 and sys.platform.startswith('win'):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


_basedir = os.path.join("..", os.path.dirname(__file__))

app = flask.Flask(__name__, static_folder="/unused")
PORT=5009
http_server = HTTPServer(WSGIContainer(app))

@app.route('/')
def welcome():
    return """
    <h1>Welcome to the Bokeh documentation server</h1>
    You probably want to go to <a href="/en/latest/index.html"> Index</a>
    """

@app.route('/versions.json')
def send_versions():
    return flask.send_from_directory(
        os.path.join(_basedir, "sphinx"), "versions.json")

@app.route('/alert.html')
def send_alert():
    return os.environ.get("BOKEH_DOCS_ALERT", "")

@app.route('/en/latest/<path:filename>')
def send_docs(filename):
    return flask.send_from_directory(
        os.path.join(_basedir, "sphinx/build/html/"), filename)

def open_browser():
    # Child process
    time.sleep(0.5)
    webbrowser.open("http://localhost:%d/en/latest/index.html" % PORT, new=2)

data = {}

def serve_http():
    data['ioloop'] = IOLoop()
    http_server.listen(PORT)
    IOLoop.current().start()

def shutdown_server():
    ioloop = data['ioloop']
    ioloop.add_callback(ioloop.stop)
    print("Asked Server to shut down.")

def ui():
    try:
        time.sleep(0.5)
        input("Press <ENTER> to exit...\n")  # lgtm [py/use-of-input]
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":

    if tornado.version_info[0] == 4:
        print('docserver.py script requires tornado 5 or higher')
        sys.exit(1)

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
