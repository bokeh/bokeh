
from os.path import abspath, join, split

import jinja2

_templates_path = join(abspath(split(__file__)[0]), "_templates")

# This template is for IPython Notebook embedding, and supports either
# directly including the full BokehJS code and css inline, or by loading
# from CDN or server.
NOTEBOOK = jinja2.Template(
    open(join(_templates_path, "notebook.html")).read()
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




