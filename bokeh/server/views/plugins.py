#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
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
