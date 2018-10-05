''' Provide Jinja2 templates used by Bokeh to embed Bokeh documents and
models in various ways.

.. bokeh-jinja:: bokeh.core.templates.AUTOLOAD_JS
.. bokeh-jinja:: bokeh.core.templates.AUTOLOAD_NB_JS
.. bokeh-jinja:: bokeh.core.templates.AUTOLOAD_TAG
.. bokeh-jinja:: bokeh.core.templates.CSS_RESOURCES
.. bokeh-jinja:: bokeh.core.templates.DOC_JS
.. bokeh-jinja:: bokeh.core.templates.DOC_NB_JS
.. bokeh-jinja:: bokeh.core.templates.FILE
.. bokeh-jinja:: bokeh.core.templates.JS_RESOURCES
.. bokeh-jinja:: bokeh.core.templates.NOTEBOOK_LOAD
.. bokeh-jinja:: bokeh.core.templates.PLOT_DIV
.. bokeh-jinja:: bokeh.core.templates.ROOT_DIV
.. bokeh-jinja:: bokeh.core.templates.SCRIPT_TAG

'''
from __future__ import absolute_import
import json
from os.path import dirname, join
import sys

from jinja2 import Environment, Markup, FileSystemLoader

def get_env():
    ''' Get the correct Jinja2 Environment, also for frozen scripts.
    '''
    if getattr(sys, 'frozen', False):
        templates_path = join(sys._MEIPASS, 'bokeh', 'core', '_templates')
        return Environment(loader=FileSystemLoader(templates_path))
    else:
        templates_path = join(dirname(__file__), '_templates')
        return Environment(loader=FileSystemLoader(templates_path))

_env = get_env()
_env.filters['json'] = lambda obj: Markup(json.dumps(obj))

JS_RESOURCES = _env.get_template("js_resources.html")

CSS_RESOURCES = _env.get_template("css_resources.html")

SCRIPT_TAG = _env.get_template("script_tag.html")

PLOT_DIV = _env.get_template("plot_div.html")

ROOT_DIV = _env.get_template("root_div.html")

DOC_JS = _env.get_template("doc_js.js")

DOC_NB_JS = _env.get_template("doc_nb_js.js")

FILE = _env.get_template("file.html")

MACROS = _env.get_template("macros.html")

NOTEBOOK_LOAD = _env.get_template("notebook_load.html")

AUTOLOAD_JS = _env.get_template("autoload_js.js")

AUTOLOAD_NB_JS = _env.get_template("autoload_nb_js.js")

AUTOLOAD_TAG = _env.get_template("autoload_tag.html")
