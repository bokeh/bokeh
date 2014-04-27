
import jinja2

# This template is for IPython Notebook embedding, and supports either
# directly including the full BokehJS code and css inline, or by loading
# from CDN or server.
NOTEBOOK = jinja2.Template("""
    {%- if css_url %}
    <link rel="stylesheet" href="{{ css_url }}" type="text/css" />
    {%- endif %}

    {%- if js_url %}
    <script type="text/javascript" src="{{ js_url }}"></script>
    {%- endif %}

    {%- if css_raw %}
    <style>
        {{ css_raw|indent(8) }}
    </style>
    {%- endif %}

    {%- if js_raw %}
    <script type="text/javascript">
        {{ js_raw|indent(8) }}
    </script>
    {%- endif %}

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



