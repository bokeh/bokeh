import flask
import hemlib
import json
import os
from os.path import join
import subprocess
import sys

app = flask.Flask(__name__)

SRCDIR = "static/coffee"
EXCLUDES = [join(SRCDIR,"demo"), join(SRCDIR,"unittest"),
            join(SRCDIR,"unittest/primitives")]

@app.route("/test/<testname>")
def test(testname):

    if app.debug:
        with open("slug.json") as f:
            slug = json.load(f)
        jslibs = hemlib.slug_libs(app, slug['libs'])
        hemfiles = hemlib.coffee_assets(SRCDIR, "localhost", 9294,
                    excludes=EXCLUDES)
    else:
        jslibs = ['/static/js/application.js']
        hemfiles = []

    tests = alltests[testname]
    testfiles = [os.path.join(SRCDIR, name+".coffee") for name in tests]

    for test in testfiles:
        if not os.path.isfile(test):
            raise RuntimeError("Cannot find test named '%s'"%test)

    hemfiles.extend(hemlib.make_urls(testfiles, "localhost", 9294))
    
    return flask.render_template("demos.html", jslibs = jslibs,
            hemfiles=hemfiles, tests=tests)


alltests = {

    'all' : [
        'demo/scatter',
        'demo/bars',
        'demo/map',
        'demo/candle',
        'demo/vector',
        'demo/group',
        'demo/stack',
        'demo/lorenz10',
        'demo/lorenz50',
        'demo/lorenz100',
    ],

    'scatter'   : ['demo/scatter'],
    'bars'      : ['demo/bars'],
    'map'       : ['demo/map'],
    'candle'    : ['demo/candle'],
    'vector'    : ['demo/vector'],
    'group'     : ['demo/group'],
    'stack'     : ['demo/stack'],
    'lorenz10'  : ['demo/lorenz10'],
    'lorenz50'  : ['demo/lorenz50'],
    'lorenz100' : ['demo/lorenz100'],

    'arc'       : ['unittest/primitives/arc_test'],
    'area'      : ['unittest/primitives/area_test'],
    'bezier'    : ['unittest/primitives/bezier_test'],
    'circle'    : ['unittest/primitives/circle_test'],
    'image'     : ['unittest/primitives/image_test'],
    'line'      : ['unittest/primitives/line_test'],
    'oval'      : ['unittest/primitives/oval_test'],
    'quad'      : ['unittest/primitives/quad_test'],
    'quadcurve' : ['unittest/primitives/quadcurve_test'],
    'ray'       : ['unittest/primitives/ray_test'],
    'rect'      : ['unittest/primitives/rect_test'],
    'segment'   : ['unittest/primitives/segment_test'],
    'text'      : ['unittest/primitives/text_test'],
    'wedge'     : ['unittest/primitives/wedge_test'],
}

allpossibletests = set()
for v in alltests.values():
    allpossibletests.update(v)
alltests['allpossibletests'] = alltests

if __name__ == "__main__":

    if sys.argv[1] == 'debug':
        app.debug = True
    app.run()
