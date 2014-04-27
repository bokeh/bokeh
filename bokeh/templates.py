
import jinja2

# This template is for IPython Notebook embedding, and supports either
# directly including the full BokehJS code and css inline, or by loading
# from CDN or server.
NOTEBOOK = jinja2.Template("""
    {%- for file in css_files %}
    <link rel="stylesheet" href="{{ file }}" type="text/css" />
    {%- endfor %}

    {%- for file in js_files %}
    <script type="text/javascript" src="{{ file }}"></script>
    {%- endfor %}

    {%- for css in css_raw %}
    <style>
        {{ css|indent(8) }}
    </style>
    {%- endfor %}

    {%- for js in jss_raw %}
    <script type="text/javascript">
        {{ js|indent(8) }}
    </script>
    {%- endfor %}

    <div>
        <a href="http://bokeh.pydata.org" target="_blank" style="text-decoration:none;">
            <img src={{ logo_url }} alt="Bokeh logo" width="20" style="vertical-align:text-bottom;" />
        </a>
        <span>BokehJS successfully loaded.</span>
    </div>

    {%- if verbose %}
    <style>
        p.bokeh_notebook { margin-left: 24px; }
        table.bokeh_notebook {
            border: 1px solid #e7e7e7;
            margin: 5px;
            margin-left: 24px;
            width: 80%;
        }
        tr.bokeh_notebook {
            border: 1px solid #e7e7e7;
            background-color: #FFF;
        }
        th.bokeh_notebook {
            border: 1px solid #e7e7e7;
            background-color: #f8f8f8;
            text-align: center;
        }
        td.bokeh_notebook {
            border: 1px solid #e7e7e7;
            background-color: #d2d7ec;
            text-align: left;
        }
    </style>
    <p class="bokeh_notebook">Using Settings:</p>
    <table class="bokeh_notebook">
        <tr class="bokeh_notebook">
            <th class="bokeh_notebook">Bokeh</th>
            <th class="bokeh_notebook">version</th>
            <td class="bokeh_notebook">{{ bokeh_version }}</td>
        </tr>
        <tr class="bokeh_notebook">
            <th class="bokeh_notebook" rowspan="2">BokehJS</th>
            <th class="bokeh_notebook">js</th>
            <td class="bokeh_notebook">{{ js_info }}</td>
        </tr>
        <tr class="bokeh_notebook">
            <th class="bokeh_notebook">css</th>
            <td class="bokeh_notebook">{{ css_info }}</td>
        </tr>
    </table>
    {%- endif %}
    {%- for warning in warnings %}
    <p style="background-color: #f2d7dc;">{{ warning }}</p>
    {%- endfor %}
""")


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




