from bokeh.io import save
from bokeh.layouts import column
from bokeh.models import Div, Paragraph

template = """
{% block postamble %}
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
{% endblock %}
"""

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

save(column(p, div1, div2), template=template)
