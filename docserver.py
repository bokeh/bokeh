import flask
import os
from gevent.pywsgi import WSGIServer
app = flask.Flask(__name__, static_path="/unused")

_basedir = os.path.dirname(__file__)
PORT=5009

"""this is a simple server to facilitate developing the docs.  by
serving up static files from this server, we avoid the need to use a
symlink.

"""


@app.route('/static/<path:filename>')
def bokeh_static(filename):
    static_dir = os.path.join(_basedir,"bokeh/server/static/")
    print filename
    print static_dir
    return flask.send_from_directory(static_dir, filename)


@app.route('/<path:filename>')
def send_pic(filename):
    return flask.send_from_directory(
        os.path.join(_basedir,"sphinx/_build/html/"), filename)


if __name__ == "__main__":
    #app.run(port=PORT)
    http_server = WSGIServer(('', PORT), app)
    print "\nStarting Bokeh plot server on port %d..." % PORT
    print "View http://localhost:%d/bokeh to see plots\n" % PORT
    http_server.serve_forever()
