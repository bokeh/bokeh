from bokeh.io import save
from bokeh.models import Circle, LinearAxis, Plot, Range1d

aliases = dict(a="above", b="below", l="left", r="right")

def make_figure(axes):
    xdr = Range1d(start=-1, end=1)
    ydr = Range1d(start=-1, end=1)

    plot = Plot(title=None, x_range=xdr, y_range=ydr, plot_width=200, plot_height=200, toolbar_location=None)
    plot.add_glyph(Circle(x=0, y=0, size=100))

    for place in axes:
        plot.add_layout(LinearAxis(), aliases[place])

    return plot

template = """
{% block preamble %}
<style>
    .grid {
        display: inline-grid;
        grid-template-columns: auto auto auto auto;
        grid-gap: 10px;
        padding: 10px;
        background-color: black;
    }
</style>
{% endblock %}
{% block contents %}
<div class="grid">
  {% for root in roots %}
    {{ embed(root) }}
  {% endfor %}
</div>
{% endblock %}
"""

axes = [
    "a",   "b",   "l",    "r",
    "al",  "ar",  "bl",   "br",
    "alr", "blr", "lab" , "rab",
    "ab",  "lr",  "ablr", "",
]

figures = list(map(make_figure, axes))
save(figures, template=template, title="CSS grid with an extended template")
