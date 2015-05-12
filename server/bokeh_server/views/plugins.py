from __future__ import absolute_import

from flask import render_template

from ..app import bokeh_app

@bokeh_app.route('/bokeh/jsgenerate/<parentname>/<modulename>/<classname>')
def generatejs(parentname, modulename, classname):
    return render_template(
        "app.js",
        modulename=modulename,
        classname=classname,
        parentname=parentname
    )
