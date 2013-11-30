import flask
from ..app import app

## This URL heirarchy is important, because of the way we build bokehjs
## the source mappings list the source file as being inside ../../src

@app.route('/bokehjs/static/<path:filename>')
def bokehjs_file(filename):
    return flask.send_from_directory(app.bokehjsdir, filename)

@app.route('/bokehjs/src/<path:filename>')
def bokehjssrc_file(filename):
    return flask.send_from_directory(app.bokehjssrcdir, filename)
