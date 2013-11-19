import flask
import os
from gevent.pywsgi import WSGIServer
app = flask.Flask(__name__, static_path="/unused")

_basedir = os.path.join("..", os.path.dirname(__file__))
PORT=5009

"""this is a simple server to facilitate developing the docs.  by
serving up static files from this server, we avoid the need to use a
symlink.

"""


@app.route('/')
def welcome():
    return """ 
    <h1>Welcome to the Bokeh documentation server</h1>
    You probably want to go to <a href="/index.html"> Index</a>
    """

@app.route('/<path:filename>')
def send_pic(filename):
    return flask.send_from_directory(
        os.path.join(_basedir,"sphinx/_build/html/"), filename)


if __name__ == "__main__":
    #app.run(port=PORT)
    http_server = WSGIServer(('', PORT), app)
    print "\nStarting Bokeh plot server on port %d..." % PORT
    print "Visit http://localhost:%d/gallery.html to see plots\n" % PORT
    
    pid = os.fork()
    if pid != 0:
        # Parent process
        http_server.serve_forever()
    else:
        # Child process
        import time
        import webbrowser
        time.sleep(0.5)
        webbrowser.open("http://localhost:%d/gallery.html"%PORT, new="tab")


