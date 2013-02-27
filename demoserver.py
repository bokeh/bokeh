import flask
import hemlib
import json
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

    'scatter'   : ['demo/scatter'],
    'bars'      : ['demo/bars'],
    'map'       : ['demo/map'],
    'candle'    : ['demo/candle'],
    'vector'    : ['demo/vector'],

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
