import flask
import hemlib
import json
import os
from os.path import join
import subprocess
import sys

app = flask.Flask(__name__)

SRCDIR = "static/coffee"
DEMO_SRCDIR = "demo/coffee"
# TODO: Should be able to remove EXCLUDES now that demo and tests have
# been moved out.
EXCLUDES = [join(SRCDIR,"demo"), join(SRCDIR,"unittest"),
            join(SRCDIR,"unittest/primitives")]

HOST = "localhost"
PORT = 9294

# TODO: Add route handlers for index urls: /, /demos, and /tests

@app.route("/demo/<demoname>")
def demo(demoname):

    if app.debug:
        with open("slug.demo.json") as f:
            slug = json.load(f)
        jslibs = hemlib.slug_libs(app, slug['libs'])
        hemfiles = hemlib.coffee_assets(SRCDIR, HOST, PORT)
    else:
        jslibs = ['/static/js/demo/application.js']
        hemfiles = []

    demos = alldemos[demoname]
    demofiles = [os.path.join(DEMO_SRCDIR, name+".coffee") for name in demos]

    for demo in demofiles:
        if not os.path.isfile(demo):
            raise RuntimeError("Cannot find demo named '%s'"%demo)

    hemfiles.extend(hemlib.make_urls(demofiles, HOST, PORT))

    return flask.render_template("demos.html", jslibs = jslibs,
            hemfiles=hemfiles, demos=demos)

@app.route("/test/<testname>")
def test(testname):
    if app.debug:
        with open("slug.tests.json") as f:
            slug = json.load(f)
        jslibs = hemlib.slug_libs(app, slug['libs'])
        hemfiles = hemlib.coffee_assets(SRCDIR, HOST, PORT,
                    excludes=EXCLUDES)
    else:
        jslibs= ['/static/js/tests/application.js']
        hemfiles = []
    tests = alltests[testname]
    testfiles = [os.path.join(SRCDIR, name+".coffee") for name in tests]
    for test in testfiles:
        if not os.path.isfile(test):
            raise RuntimeError("Cannot find test named '%s'"%demo)

    hemfiles.extend(hemlib.make_urls(testfiles, HOST, PORT))

    return flask.render_template("tests.html", jslibs=jslibs,
            hemfiles=hemfiles, tests=tests)


alldemos = {

    'all' : [
        'scatter',
        'image',
        'bars',
        'map',
        'candle',
        'vector',
        'group',
        'stack',
        'lorenz10',
        'lorenz50',
        'lorenz100',
    ],

    'scatter'   : ['scatter'],
    'image'     : ['image'],
    'bars'      : ['bars'],
    'map'       : ['map'],
    'candle'    : ['candle'],
    'vector'    : ['vector'],
    'group'     : ['group'],
    'stack'     : ['stack'],
    'lorenz10'  : ['lorenz10'],
    'lorenz50'  : ['lorenz50'],
    'lorenz100' : ['lorenz100'],
}

alltests = {

    'allplots' : [
        "unittest/plot_test_simple",
        "unittest/tools_test",
        "unittest/plot_test_grid",
        "unittest/date_test",
        "unittest/legend_test"
    ],

    'allunit' : [
        "unittest/bokeh_test",
        "unittest/hasparent_test",
        "unittest/hasproperty_test"
    ],

    'tick' : ['unittest/tick_test'],

    'perf' : ['unittest/perf_test'],

    'prim' : [
        'unittest/primitives/annular_wedge_test',
        'unittest/primitives/annulus_test',
        'unittest/primitives/arc_test',
        'unittest/primitives/area_test',
        'unittest/primitives/bezier_test',
        'unittest/primitives/circle_test',
        'unittest/primitives/imageuri_test',
        'unittest/primitives/line_test',
        'unittest/primitives/oval_test',
        'unittest/primitives/quad_test',
        'unittest/primitives/quadcurve_test',
        'unittest/primitives/ray_test',
        'unittest/primitives/rect_test',
        'unittest/primitives/segment_test',
        'unittest/primitives/text_test',
        'unittest/primitives/wedge_test',
    ],

    'annular_wedge' : ['unittest/primitives/annular_wedge_test'],
    'annulus'       : ['unittest/primitives/annulus_test'],
    'arc'           : ['unittest/primitives/arc_test'],
    'area'          : ['unittest/primitives/area_test'],
    'bezier'        : ['unittest/primitives/bezier_test'],
    'circle'        : ['unittest/primitives/circle_test'],
    'imageuri'      : ['unittest/primitives/imageuri_test'],
    'line'          : ['unittest/primitives/line_test'],
    'oval'          : ['unittest/primitives/oval_test'],
    'quad'          : ['unittest/primitives/quad_test'],
    'quadcurve'     : ['unittest/primitives/quadcurve_test'],
    'ray'           : ['unittest/primitives/ray_test'],
    'rect'          : ['unittest/primitives/rect_test'],
    'segment'       : ['unittest/primitives/segment_test'],
    'text'          : ['unittest/primitives/text_test'],
    'wedge'         : ['unittest/primitives/wedge_test'],
}

allpossibletests = set()
for v in alltests.values():
    allpossibletests.update(v)
alltests['allpossibletests'] = alltests

if __name__ == "__main__":

    if len(sys.argv)>1 and sys.argv[1] == 'debug':
        app.debug = True
    app.run()
