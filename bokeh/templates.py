''' The templates module contains Jinja2 templates used by Bokeh embed
Bokeh models (e.g. plots, widgets, layouts) in various ways.

.. bokeh-jinja:: bokeh.templates.AUTOLOAD
.. bokeh-jinja:: bokeh.templates.AUTOLOAD_SERVER
.. bokeh-jinja:: bokeh.templates.AUTOLOAD_STATIC
.. bokeh-jinja:: bokeh.templates.CSS_RESOURCES
.. bokeh-jinja:: bokeh.templates.FILE
.. bokeh-jinja:: bokeh.templates.JS_RESOURCES
.. bokeh-jinja:: bokeh.templates.NOTEBOOK_LOAD
.. bokeh-jinja:: bokeh.templates.NOTEBOOK_DIV
.. bokeh-jinja:: bokeh.templates.PLOT_DIV
.. bokeh-jinja:: bokeh.templates.PLOT_JS
.. bokeh-jinja:: bokeh.templates.PLOT_SCRIPT

'''
from __future__ import absolute_import

from jinja2 import Environment, PackageLoader

_env = Environment(loader=PackageLoader('bokeh', '_templates'))

JS_RESOURCES = _env.get_template("js_resources.html")
CSS_RESOURCES = _env.get_template("css_resources.html")

PLOT_DIV = _env.get_template("plot_div.html")
PLOT_JS = _env.get_template("plot_js.js")
PLOT_SCRIPT = _env.get_template("plot_script.html")

FILE = _env.get_template("file.html")

NOTEBOOK_LOAD = _env.get_template("notebook_load.html")
NOTEBOOK_DIV = _env.get_template("notebook_div.html")

AUTOLOAD = _env.get_template("autoload.js")
AUTOLOAD_SERVER = _env.get_template("autoload_server.html")
AUTOLOAD_STATIC = _env.get_template("autoload_static.html")
