import flask
import json
import os
app = flask.Flask(__name__)
@app.route("/test/<testname>")
def test(testname):
    with open("static/js/targets.json") as f:
        targets = json.load(f)
    targets = [os.path.relpath(x, app.static_folder) for x in targets]
    targets = [flask.url_for('static', filename=x) for x in targets]
    tests = alltests[testname]
    return flask.render_template("tests.html", jsfiles=targets, tests=tests)

alltests = {
    'allplots' : ["unittest/plot_test_simple",
                  "unittest/tools_test",
                  "unittest/plot_test_grid",
                  "unittest/date_test",
                  "unittest/glyph_test",
                  "unittest/legend_test"],
    'allunit' : ["unittest/bokeh_test",
                 "unittest/hasparent_test",
                 "unittest/hasproperty_test"],
    'tick' : ['unittest/tick_test'],
    'glyph' : ['unittest/glyph_test'],
    }

if __name__ == "__main__":
    app.debug = True
    app.run()
