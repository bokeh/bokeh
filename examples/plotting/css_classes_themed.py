from bokeh.io import curdoc, save
from bokeh.layouts import column
from bokeh.models import Div, InlineStyleSheet
from bokeh.themes import Theme

template = """
{% block postamble %}
<style>
    :root {
        --custom-1-border-color: #2397D8;
        --custom-2-border-color: #14999A;
    }
</style>
{% endblock %}
"""

stylesheet = InlineStyleSheet(css="""
:host(.custom) {
    border-radius: 0.5em;
    padding: 1em;
}
:host(.custom-1) {
    border: 3px solid var(--custom-1-border-color);
}
:host(.custom-2) {
    border: 3px solid var(--custom-2-border-color);
    background-color: whitesmoke;
}
""")

curdoc().theme = Theme(
    json=dict(
        attrs=dict(
            UIElement=dict(stylesheets=[stylesheet]),
        ),
    ),
)

p = Div(text="The divs below were configured with additional <code>css_classes</code>:")

div1 = Div(text="""
<p>This Bokeh Div adds the style classes:<p>
<pre>
:host(.custom) {
    border-radius: 0.5em;
    padding: 1em;
}
:host(.custom-1) {
    border: 3px solid #2397D8;
}
</pre>
""", css_classes=["custom", "custom-1"])

div2 = Div(text="""
<p>This Bokeh Div adds the style classes:<p>
<pre>
:host(.custom) {
    border-radius: 0.5em;
    padding: 1em;
}
:host(.custom-2) {
    border: 3px solid #14999A;
    background-color: whitesmoke;
}
</pre>
""", css_classes=["custom", "custom-2"])

save(column(p, div1, div2), template=template)
