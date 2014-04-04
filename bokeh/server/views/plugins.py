
from flask import (
    render_template, request, send_from_directory,
    abort, jsonify, Response, redirect
)
from ..app import bokeh_app
@bokeh_app.route('/bokeh/jsgenerate/<modulename>/<classname>/<parentname>')
def generatejs(modulename, classname, parentname):
    return render_template("app.js", modulename=modulename,
                           classname=classname,
                           parentname=parentname)
