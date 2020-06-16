from bokeh.io import save
from bokeh.models import Circle, LinearAxis, Plot, Range1d

template ="""
{% block preamble %}
<style>
    body { background-color: lightblue; }
</style>
{% endblock %}
"""

plot = Plot(plot_width=600, plot_height=600,
            x_range=Range1d(0, 10), y_range=Range1d(0, 10),
            toolbar_location=None)

# This is the no-fill that we're testing
plot.background_fill_color = None
plot.border_fill_color = None

plot.add_glyph(Circle(x=3, y=3, size=50, fill_color='#ffffff'))
plot.add_glyph(Circle(x=6, y=6, size=50, fill_color='#ffffff'))

yaxis = LinearAxis(major_label_text_color='#ffffff', major_label_text_font_size="40px")
plot.add_layout(yaxis, 'left')

xaxis = LinearAxis(major_label_text_color='#ffffff', major_label_text_font_size="40px")
plot.add_layout(xaxis, 'below')

save(plot, template=template)
