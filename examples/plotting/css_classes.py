from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import Div, InlineStyleSheet

stylesheet = InlineStyleSheet(css="""
:host(.custom) {
    border-radius: 0.5em;
    padding: 1em;
}
:host(.custom-1) {
    border: 3px solid #2397D8;
}
:host(.custom-2) {
    border: 3px solid #14999A;
    background-color: whitesmoke;
}
""")

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
""")
div1.css_classes = ["custom", "custom-1"]
div1.stylesheets = [stylesheet]

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
""")
div2.css_classes = ["custom", "custom-2"]
div2.stylesheets = [stylesheet]

show(column(p, div1, div2))
