''' The templates module contains templates used by Bokeh to
enable embedding Bokeh plots in various ways.

Attributes:
    JS_RESOURCES: This template is for loading BokehJS code and css
        according to the configuration in a Resources object.

Args:
    js_files (list[str]) : a list of URIs for JS files to include
    js_raw (list[str]) : a list of raw JS snippets to put between `<style>` tags

Attributes:
    CSS_RESOURCES: This template is for loading Bokeh css
        according to the configuration in a Resources object.

Args:
    css_files (list[str]) : a list of URIs for CSS files to include
    css_raw (list[str]) : a list of raw CSS snippets to put between `<style>` tags

Attributes:
    PLOT_DIV: This template is for creating a basic plot div (to be
        used in conjunction with PLOT_JS).

Args:
    elementid (str) : a unique identifier for the div
        a PLOT_JS template should be configured with the same elementid

Attributes:
    PLOT_JS: This template is for creating the JavaScript code snippet
        that can render a plot into a corresponding PLOT_DIV.

Args:
    modelid (str) : The Bokeh model id for the object to render
        typically for a Plot, PlotContext, etc.
    modeltype (str) : the type of the model to render
        used to reference the appropriate Backbone collection
    elementid (str) : the id of the div to render the plot into

Attributes:
    PLOT_SCRIPT: This template is for creating a full ``<script>`` tag
        for raw JS code. Useful with the PLOT_JS template.

Args:
    plot_js (str) : raw JavaScript code to include

Attributes:
    FILE: This template is for rendering Bokeh plots into a basic .html file.

Args:
    title (str) : a value for `<title>` tags
    plot_resources (str) : typically the output of RESOURCES
    plot_script (str) : typically the output of PLOT_SCRIPT
    plot_div (str) : typically the output of PLOT_DIV

    Users can customize the file output by providing their own template
    with these parameters.

Attributes:
    NOTEBOOK_LOAD: This template is for loading BokehJS code and CSS
        into the IPython Notebook according to a resources configuration.

Args:
    plot_resources (str) : typically the output of RESOURCES
    log_url (str) : URL to Bokeh logo to dispay
    verbose (bool) : whether to display verbose info about BokehJS configuration, etc
    bokeh_version (str) : the current version of Bokeh
    js_info (str) : information about the location, version, etc. of BokehJS code
    css_info (str) : information about the location, version, etc. of BokehJS css
    warnings (list[str]) : list of warnings to display to user

Attributes:
    NOTEBOOK_DIV: This template is for rendering a Bokeh plot into the
        IPython Notebook.

Args:
    plot_script (str) : typically the output of PLOT_SCRIPT
    plot_div (str) : typically the output of PLOT_DIV

Attributes:
    AUTOLOAD: This template is for creating an "autoload" JS script.
        The script automatically and asynchronously loads BokehJS (if
        necessary) and then replaces any suitably constructed
        ``<script>`` tag that loads it with the rendered plot.

Attributes:
    AUTOLOAD_SERVER: This template is for creating ``<script>`` tags
        that run AUTOLOAD scripts for plots that connect to a Bokeh Server
        for their data

Args:
    src_path (str) : path to AUTOLOAD script
    elementid (str) : the a unique id for the script tag
    modelid (str) : The Bokeh model id for the object to render
        typically for a Plot, PlotContext, etc.
    root_url (str) : root URL of the Bokeh Server
    docid (str) : document ID for the document on the server to load
    docapikey (str) : API key for the document

Attributes:
    AUTOLOAD_STATIC: This template is for creating ``<script>`` tags
        that run AUTOLOAD scripts for plots that have their data embedded
        in the AUTOLOAD script

Args:
    src_path (str) : path to AUTOLOAD script
    elementid (str) : the a unique id for the script tag
    modelid (str) : The Bokeh model id for the object to render
        typically for a Plot, PlotContext, etc.
    modeltype (str) : the type of the model to render
        used to reference the appropriate Backbone collection

.. note:: This script injects a ``<div>`` in place, so must be placed under ``<body>``.

'''

from __future__ import absolute_import

from os.path import abspath, join, split

import jinja2

_templates_path = join(abspath(split(__file__)[0]), "_templates")

JS_RESOURCES = jinja2.Template(
    open(join(_templates_path, "js_resources.html")).read()
)

CSS_RESOURCES = jinja2.Template(
    open(join(_templates_path, "css_resources.html")).read()
)


PLOT_DIV = jinja2.Template(
    open(join(_templates_path, "plot_div.html")).read()
)


PLOT_JS = jinja2.Template(
    open(join(_templates_path, "plot_js.js")).read()
)

PLOT_SCRIPT = jinja2.Template(
    open(join(_templates_path, "plot_script.html")).read()
)


FILE = jinja2.Template(
    open(join(_templates_path, "file.html")).read()
)


NOTEBOOK_LOAD = jinja2.Template(
    open(join(_templates_path, "notebook_load.html")).read()
)


NOTEBOOK_DIV = jinja2.Template(
    open(join(_templates_path, "notebook_div.html")).read()
)


AUTOLOAD = jinja2.Template(
    open(join(_templates_path, "autoload.js")).read()
)


AUTOLOAD_SERVER = jinja2.Template(
    open(join(_templates_path, "autoload_server.html")).read()
)

AUTOLOAD_SERVER_PUBLIC = jinja2.Template(
    open(join(_templates_path, "autoload_server.html")).read()
)


AUTOLOAD_STATIC= jinja2.Template(
    open(join(_templates_path, "autoload_static.html")).read()
)
