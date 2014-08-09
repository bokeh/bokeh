from flask import Flask, render_template
from os.path import dirname, join, abspath
import logging
approot = abspath(dirname(dirname(__file__)))
app = Flask('sampleapp')
app.debug = True
from bokeh.pluginutils import app_document
from stock_example_embedded import StockApp

"""
This is an example applet embedded into another flask app.  You will need to download some sample data from quantquote, which can be executed from the download.py script

Then, execute bokeh-server --script stock_example_embedded.py, and python embedded_server.py
point your browser at http://localhost:5050/app
"""

bokeh_location = "localhost:5006"
bokeh_url = "http://" + bokeh_location

@app_document("stock_example", bokeh_url)
def make_stock_applet():
    app = StockApp.create()
    return app

@app.route("/app")
def main():
    app = make_stock_applet()
    html = """
    <html>
    <head>
    <script src="%s"></script>
    <script>
    window._bokeh_onload_callbacks = [window.StockApp.main];
    </script>
    </head>
    <body>
    %s
    </body>
    </html>
    """
    html = html % (bokeh_url + "/bokeh/jsgenerate/VBox/StockApp/StockApp", app.tag)
    return html

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.DEBUG)
    app.debug = True
    app.run(host='0.0.0.0', port=5050)
