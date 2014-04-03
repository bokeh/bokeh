from bokeh.server.app import bokeh_app
from bokeh.pluginutils import app_document
print 'import'
@bokeh_app.route("/exampleapp")
def test():
    return "hello world"
