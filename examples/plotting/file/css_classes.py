from jinja2 import Template

from bokeh.embed import file_html
from bokeh.layouts import column
from bokeh.models import Div, Paragraph
from bokeh.resources import CDN
from bokeh.util.browser import view

template = Template("""
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>{{ title if title else "Bokeh Plot" }}</title>
        {{ bokeh_css }}
        {{ bokeh_js }}
        <style>
        .custom {
            border-radius: 0.5em;
            padding: 1em;
        }
        .custom-1 {
            border: 3px solid #2397D8;
        }
        .custom-2 {
            border: 3px solid #14999A;
            background-color: whitesmoke;
        }
        </style>
    </head>
    <body>
        {{ plot_div|indent(8) }}
        {{ plot_script|indent(8) }}
    </body>
</html>
""")

p = Paragraph(text="The divs below were configured with additional css_classes:")

div1 = Div(text="""
<p> This Bokeh Div adds the style classes:<p>
<pre>
.custom {
    border-radius: 0.5em;
    padding: 1em;
}
.custom-1 {
    border: 3px solid #2397D8;
}
</pre>
""")
div1.css_classes = ["custom", "custom-1"]

div2 = Div(text="""
<p> This Bokeh Div adds the style classes:<p>
<pre>
.custom {
    border-radius: 0.5em;
    padding: 1em;
}
.custom-2 {
    border: 3px solid #14999A;
    background-color: whitesmoke;
}
</pre>
""")
div2.css_classes = ["custom", "custom-2"]

html = file_html(column(p, div1, div2), template=template, resources=CDN)

output_file = 'css_classes.html'

with open(output_file, 'w') as f:
    f.write(html)

view(output_file)
