"""
This is an example applet embedded into another flask app. See the
README.md file in this rectory for instructions on running.
"""
from __future__ import print_function

from os.path import dirname, join, abspath

from bokeh.pluginutils import app_document
from flask import Flask, render_template
import jinja2

from stock_example_embedded import StockApp

app = Flask('sampleapp')

bokeh_url = "http://localhost:5006"
applet_url = "http://localhost:5050/applet"

@app_document("stock_example", bokeh_url)
def make_stock_applet():
    app = StockApp.create()
    return app

@app.route("/")
def root():
    return r"Example is located at <a href='%s'>%s</a>" % (applet_url, applet_url)

@app.route("/applet")
def applet():
    applet = make_stock_applet()
    template = jinja2.Template(open("stocks.html").read())
    return template.render(
        app_url = bokeh_url + "/bokeh/jsgenerate/VBox/StockApp/StockApp",
        app_tag = applet.tag
    )

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.DEBUG)
    print("\nView this example at: %s\n" % applet_url)
    app.debug = True
    app.run(host='0.0.0.0', port=5050)
