import flask
from ..app import bokeh_app

## This URL heirarchy is important, because of the way we build bokehjs
## the source mappings list the source file as being inside ../../src

@bokeh_app.route('/bokehjs/static/<path:filename>')
def bokehjs_file(filename):
    return flask.send_from_directory(bokeh_app.bokehjsdir, filename)

@bokeh_app.route('/bokehjs/src/<path:filename>')
def bokehjssrc_file(filename):
    return flask.send_from_directory(bokeh_app.bokehjssrcdir, filename)
