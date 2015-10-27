''' The templates module contains Jinja2 templates used by Bokeh embed
Bokeh models (e.g. plots, widgets, layouts) in various ways.

.. bokeh-jinja:: bokeh.templates.AUTOLOAD_JS
.. bokeh-jinja:: bokeh.templates.AUTOLOAD_TAG
.. bokeh-jinja:: bokeh.templates.CSS_RESOURCES
.. bokeh-jinja:: bokeh.templates.DOC_JS
.. bokeh-jinja:: bokeh.templates.FILE
.. bokeh-jinja:: bokeh.templates.JS_RESOURCES
.. bokeh-jinja:: bokeh.templates.NOTEBOOK_LOAD
.. bokeh-jinja:: bokeh.templates.NOTEBOOK_DIV
.. bokeh-jinja:: bokeh.templates.PLOT_DIV
.. bokeh-jinja:: bokeh.templates.SCRIPT_TAG

'''
from __future__ import absolute_import

from jinja2 import Environment, PackageLoader

_env = Environment(loader=PackageLoader('bokeh', '_templates'))

JS_RESOURCES = _env.get_template("js_resources.html")
CSS_RESOURCES = _env.get_template("css_resources.html")

SCRIPT_TAG = _env.get_template("script_tag.html")

PLOT_DIV = _env.get_template("plot_div.html")

DOC_JS = _env.get_template("doc_js.js")

FILE = _env.get_template("file.html")

NOTEBOOK_LOAD = _env.get_template("notebook_load.html")
NOTEBOOK_DIV = _env.get_template("notebook_div.html")

AUTOLOAD_JS = _env.get_template("autoload_js.js")
AUTOLOAD_TAG = _env.get_template("autoload_tag.html")
