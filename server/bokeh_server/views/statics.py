from __future__ import absolute_import

import flask

from ..app import bokeh_app

## This URL heirarchy is important, because of the way we build bokehjs
## the source mappings list the source file as being inside ../../src

@bokeh_app.route('/bokehjs/static/<path:filename>')
def bokehjs_file(filename):
    """ Return a specific BokehJS deployment file

    :param filename: name of the file to retrieve

    :status 200: file is found
    :status 404: file is not found

    """
    return flask.send_from_directory(bokeh_app.bokehjsdir, filename)

@bokeh_app.route('/bokehjs/src/<path:filename>')
def bokehjssrc_file(filename):
    """ Return a specific BokehJS source code file

    :param filename: name of the file to retrieve

    :status 200: file is found
    :status 404: file is not found

    """
    return flask.send_from_directory(bokeh_app.bokehjssrcdir, filename)
