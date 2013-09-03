import flask
import hemlib
import json
import os
from os.path import join
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
slug = json.load(open("slug.all.json"))

@app.route("/")
def welcome():
    return flask.render_template("welcome.html", alldemos=alldemos, alltests=alltests)

def display_page(file_set, template, **extra_template_vars):
    for f in file_set:
        if not os.path.isfile(f):
            raise RuntimeError("Cannot find file named '%s'" % f)
    if app.debug:
        jslibs = hemlib.slug_libs(app, slug['libs'])
        hemfiles = hemlib.coffee_assets(SRCDIR, HOST, slug['port'],
                                        excludes=EXCLUDES)
        hemfiles.extend(hemlib.make_urls(file_set, HOST, slug['port']))
        print "demoserver hemfiles", hemfiles
    else:
        jslibs= ['/static/js/demo/application.js']
        hemfiles = []
    return flask.render_template(template, jslibs=jslibs,
            hemfiles=hemfiles, **extra_template_vars)

@app.route("/demo/<demoname>")
def demo(demoname):
    demos = alldemos[demoname]
    demofiles = [os.path.join(DEMO_SRCDIR, name+".coffee") for name in demos]
    return display_page(demofiles, "demos.html", demos=demos)

@app.route("/test/<testname>")
def test(testname):
    if testname in alltests:
        tests = alltests[testname]
        testfiles = [os.path.join(TEST_SRCDIR, name+".coffee") for name in tests]
        return display_page(testfiles, "tests.html", tests=tests)
    else:
        testfilename = os.path.join(TEST_SRCDIR, testname+".coffee")
        if os.path.isfile(testfilename):
            return display_page([testfilename], "tests.html", tests=[testname])
        else:
            flask.abort(404)

alldemos = {

    'all' : [
        'scatter',
        'image',
        'bars',
        'gmap',
        'map',
        'map_overlay',
        'candle',
        'vector',
        'group',
        'stack',
        'lorenz10',
        'lorenz50',
        'lorenz100',
        'grid_plot',
    ],

    'scatter'    : ['scatter'],
    'image'      : ['image'],
    'bars'       : ['bars'],
    'gmap'       : ['gmap'],
    'map'        : ['map'],
    'map_overlay': ['map_overlay'],
    'candle'     : ['candle'],
    'vector'     : ['vector'],
    'group'      : ['group'],
    'stack'      : ['stack'],
    'lorenz10'   : ['lorenz10'],
    'lorenz50'   : ['lorenz50'],
    'lorenz100'  : ['lorenz100'],
    'grid_plot'  : ['grid_plot'],

}


alltests = {

    'base' : [
        'hasparent_test',
        'hasproperty_test',
    ],

    'common' : [
        'ranges_test',
        'ticking_test',
    ],

    'perf' : ['perf_test'],

    'axes' : [
        'linear_axis_test',
    ],

    'tools_test' : [
        'tools_test',
    ],

    'nonprim': [
        'legend_test',
        'linear_axis_test',
        'ranges_test',
        'ticking_test',
        'hasparent_test',
        'hasproperty_test',
        'perf_test',
    ],

    'prim' : [
        'annular_wedge',
        'annulus',
        'arc',
        'bezier',
        'circle',
        'image_uri',
        'line',
        'multi_line',
        'oval',
        'patch',
        'patches',
        'quad',
        'quadcurve',
        'ray',
        'rect',
        'segment',
        'square',
        'text',
        'wedge',
    ],

    'annular_wedge' : ['primitives/annular_wedge_test'],
    'annulus'       : ['primitives/annulus_test'],
    'arc'           : ['primitives/arc_test'],
    'bezier'        : ['primitives/bezier_test'],
    'circle'        : ['primitives/circle_test'],
    'image_uri'     : ['primitives/image_uri_test'],
    'line'          : ['primitives/line_test'],
    'multi_line'    : ['primitives/multi_line_test'],
    'oval'          : ['primitives/oval_test'],
    'patch'         : ['primitives/patch_test'],
    'patches'       : ['primitives/patches_test'],
    'quad'          : ['primitives/quad_test'],
    'quadcurve'     : ['primitives/quadcurve_test'],
    'ray'           : ['primitives/ray_test'],
    'rect'          : ['primitives/rect_test'],
    'square'        : ['primitives/square_test'],
    'segment'       : ['primitives/segment_test'],
    'text'          : ['primitives/text_test'],
    'wedge'         : ['primitives/wedge_test'],

}

allpossibletests = set()
for v in alltests.values():
    allpossibletests.update(v)
alltests['allpossibletests'] = allpossibletests

if __name__ == "__main__":

    if len(sys.argv)>1 and sys.argv[1] == 'debug':
        app.debug = True
    app.run()
