
from os.path import abspath, join, split

import jinja2

_templates_path = join(abspath(split(__file__)[0]), "_templates")


# This template is for loading BokehJS code and css, either inline
# or by loading from CDN or server
RESOURCES = jinja2.Template(
    open(join(_templates_path, "resources.html")).read()
)


# This template is for a basic plot div to be used in conjunction
# with PLOTJS to render the plot into the div
PLOT_DIV = jinja2.Template(
    open(join(_templates_path, "plot_div.html")).read()
)


# This template has the bare js code for synchronously loading a
# Bokeh into a specified plotdiv
PLOTJS = jinja2.Template(
    open(join(_templates_path, "plot.js")).read()
)

# This template has the puts the PLOTJS code into script tags, provides
# an opportunity to put  a wrapper around the code.
PLOT_SCRIPT = jinja2.Template(
    open(join(_templates_path, "plot_script.html")).read()
)


# This template is for rendering Bokeh documents into a basic
# HTML file
FILE = jinja2.Template(
    open(join(_templates_path, "file.html")).read()
)


# This template is for IPython Notebook loading, and supports either
# directly including the full BokehJS code and css inline, or by loading
# from CDN or server.
NOTEBOOK_LOAD = jinja2.Template(
    open(join(_templates_path, "notebook_load.html")).read()
)


# This template is for simple IPython Notebook embedding
NOTEBOOK_DIV = jinja2.Template(
    open(join(_templates_path, "notebook_div.html")).read()
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




