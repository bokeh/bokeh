''' The templates module contains templates used by Bokeh to
enable embedding Bokeh plots in various ways.

Attributes:
    RESOURCES: This template is for loading BokehJS code and css according to the configuration in a Resources object.

Args:
    css_files (list[str]) : a list of URIs for CSS files to include
    js_files (list[str]) : a list of URIs for JS files to include
    css_raw (list[str]) : a list of raw CSS snippets to put between `<style>` tags
    js_raw (list[str]) : a list of raw JS snippets to put between `<style>` tags

Attributes:
    PLOT_DIV: This template is for creating a basic plot div (to be used in conjunction with PLOT_JS).

Args:
    elementid (str) : a unique identifier for the div
        a PLOT_JS template should be configured with the same elementid

Attributes:
    PLOT_JS: This template is for creating the JavaScript code snippet that can render a plot into a corresponding PLOT_DIV.

Args:
    modelid (str) : The Bokeh model id for the object to render
        typically for a Plot, PlotContext, etc.
    modeltype (str) : the type of the model to render
        used to reference the appropriate Backbone collection
    elementid (str) : the id of the div to render the plot into

Attributes:
    PLOT_SCRIPT: This template is for creating a full ``<script>`` tag for raw JS code. Useful with the PLOT_JS template.

Args:
    plot_js (str) : raw JavaScript code to include

Attributes:
    FILE: This template is for rendering Bokeh plots into a basic .html file.

Args:
    title (str) : a value for `<title>` tags
    plot_resources (str) : typically the output of RESOURCES
    plot_script (str) : typically the output of PLOT_SCRIPT
    plot_div (str) : typically the output of PLOT_DIV

    Users can customize the file output by providing their own template with these parameters.

Attributes:
    NOTEBOOK_LOAD: This template is for loading BokehJS code and CSS into the IPython Notebook according to a resources configuration.

Args:
    plot_resources (str) : typically the output of RESOURCES
    log_url (str) : URL to Bokeh logo to dispay
    verbose (bool) : whether to display verbose info about BokehJS configuration, etc
    bokeh_version (str) : the current version of Bokeh
    js_info (str) : information about the location, version, etc. of BokehJS code
    css_info (str) : information about the location, version, etc. of BokehJS css
    warnings list[str] : list of warnings to display to user

Attributes:
    NOTEBOOK_DIV: This template is for rendering a Bokeh plot into the IPython Notebook.

Args:
    plot_script (str) : typically the output of PLOT_SCRIPT
    plot_div (str) : typically the output of PLOT_DIV

Attributes:
    AUTOLOAD: This template is for creating a standalone, drop in ``<script>`` tag that will automatically and asynchronously load BokehJS (if necessary) and replace itself with a rendered plot. This script will reference a separate JavaScript (.js) file that contains code to render a specific plot and possibly data for the plot inline.

'''

from os.path import abspath, join, split

import jinja2

_templates_path = join(abspath(split(__file__)[0]), "_templates")

RESOURCES = jinja2.Template(
    open(join(_templates_path, "resources.html")).read()
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


AUTOLOAD_SERVER = jinja2.Template('''
<script
    src="%(script_url)s"
    data-bokeh-plottype="serverconn"
    bokeh_docid="%(docid)s"
    bokeh_ws_conn_string="%(ws_conn_string)s"
    bokeh_docapikey="%(docapikey)s"
    bokeh_root_url="%(root_url)s"
    bokeh_modelid="%(modelid)s"
    bokeh_modeltype="%(modeltype)s"
    async="true"
>
</script>
''')


AUTOLOAD_STATIC = jinja2.Template('''
<script
    src="%(embed_filename)s"
    bokeh_plottype="embeddata"
    bokeh_modelid="%(modelid)s"
    bokeh_modeltype="%(modeltype)s"
    async="true"
>
</script>
''')




