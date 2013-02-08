import flask
import hemlib
import json
import os
import sys


app = flask.Flask(__name__)


@app.route("/test/<testname>")
def test(testname):
    if app.debug:
        with open("slug.json") as f:
            slug = json.load(f)
        static_js = hemlib.slug_libs(app, slug['libs'])
        hem_js = hemlib.coffee_assets("static/coffee", "localhost", 9294)
    else:
        static_js = ['/static/js/application.js']
        hem_js = []
    tests = alltests[testname]
    return flask.render_template("tests.html", jsfiles=static_js, hemfiles=hem_js, tests=tests)


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

    'prim' : [
        'unittest/primitives/arc_test',
        'unittest/primitives/circle_test',
        'unittest/primitives/oval_test',
        'unittest/primitives/quad_test',
        'unittest/primitives/rect_test',
    ],

    'arc'    : ['unittest/primitives/arc_test'],
    'circle' : ['unittest/primitives/circle_test'],
    'oval'   : ['unittest/primitives/oval_test'],
    'quad'   : ['unittest/primitives/quad_test'],
    'rect'   : ['unittest/primitives/rect_test'],
}

if __name__ == "__main__":

    if sys.argv[1] == 'debug':
        app.debug = True
    app.run()
