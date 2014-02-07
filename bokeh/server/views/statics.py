import flask
from ..app import bokeh_app
import os

## This URL heirarchy is important, because of the way we build bokehjs
## the source mappings list the source file as being inside ../../src

@bokeh_app.route('/bokehjs/static/<path:filename>')
def bokehjs_file(filename):
    print '/bokehjs/static/<path:filename>', bokeh_app.bokehjsdir, filename
    return flask.send_from_directory(bokeh_app.bokehjsdir, filename)

@bokeh_app.route('/bokehjs/src/<path:filename>')
def bokehjssrc_file(filename):
    return flask.send_from_directory(bokeh_app.bokehjssrcdir, filename)
    # print '/bokehjs/src/<path:filename>', bokeh_app.bokehjssrcdir, filename
    # bokehjs_dir = os.path.join(bokeh_app.bokehjssrcdir, "../../../bokehjs")
    # return flask.send_from_directory(bokehjs_dir, filename)
