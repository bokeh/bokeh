import flask
import hemlib
import json
import os
from os.path import join
import subprocess
import sys

app = flask.Flask(__name__)

SRCDIR = "static/coffee"
TEST_SRCDIR = "tests/coffee"
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
    testfiles = [os.path.join(TEST_SRCDIR, name+".coffee") for name in tests]
    for test in testfiles:
        if not os.path.isfile(test):
            raise RuntimeError("Cannot find test named '%s'" % test)

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
        "plot_test_simple",
        "tools_test",
        "plot_test_grid",
        "date_test",
        "legend_test"
    ],

    'allunit' : [
        "bokeh_test",
        "hasparent_test",
        "hasproperty_test"
    ],

    'tick' : ['tick_test'],

    'perf' : ['perf_test'],

    'prim' : [
        'primitives/annular_wedge_test',
        'primitives/annulus_test',
        'primitives/arc_test',
        'primitives/area_test',
        'primitives/bezier_test',
        'primitives/circle_test',
        'primitives/imageuri_test',
        'primitives/line_test',
        'primitives/oval_test',
        'primitives/quad_test',
        'primitives/quadcurve_test',
        'primitives/ray_test',
        'primitives/rect_test',
        'primitives/segment_test',
        'primitives/text_test',
        'primitives/wedge_test',
    ],

    'annular_wedge' : ['primitives/annular_wedge_test'],
    'annulus'       : ['primitives/annulus_test'],
    'arc'           : ['primitives/arc_test'],
    'area'          : ['primitives/area_test'],
    'bezier'        : ['primitives/bezier_test'],
    'circle'        : ['primitives/circle_test'],
    'imageuri'      : ['primitives/imageuri_test'],
    'line'          : ['primitives/line_test'],
    'oval'          : ['primitives/oval_test'],
    'quad'          : ['primitives/quad_test'],
    'quadcurve'     : ['primitives/quadcurve_test'],
    'ray'           : ['primitives/ray_test'],
    'rect'          : ['primitives/rect_test'],
    'segment'       : ['primitives/segment_test'],
    'text'          : ['primitives/text_test'],
    'wedge'         : ['primitives/wedge_test'],
}

allpossibletests = set()
for v in alltests.values():
    allpossibletests.update(v)
alltests['allpossibletests'] = alltests

if __name__ == "__main__":

    if len(sys.argv)>1 and sys.argv[1] == 'debug':
        app.debug = True
    app.run()
