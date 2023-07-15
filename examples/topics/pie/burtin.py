''' A reproduction of `Will Burtin's historical visualization`_ of antibiotic
efficacies with some minimal changes to improve readibility.

.. note::
    This chart is reproduced as a demonstration of Bokeh's versatile graphics
    capabilities, but there are better, simpler ways to present this data.

.. bokeh-example-metadata::
    :sampledata: antibiotics
    :apis: bokeh.plotting.figure.annular_wedge, bokeh.plotting.figure.circle, bokeh.plotting.figure.text
    :refs: :ref:`ug_topics_pie_glyphs`, :ref:`ug_styling_visuals`
    :keywords: text, wedges

.. _Will Burtin's historical visualization: https://mbostock.github.io/protovis/ex/antibiotics-burtin.html

'''
from numpy import arange, array, cos, log, pi, sin, sqrt

from bokeh.models import ColumnDataSource, Legend, LegendItem
from bokeh.plotting import figure, show
from bokeh.sampledata.antibiotics import data as df

DRUGS = ("penicillin", "streptomycin", "neomycin")
COLORS = ("#0d3362", "#c64737", "#000000")
GRAM = dict([
    ("negative", "#e69584"),
    ("positive", "#aeaeb8"),
])

big_angle = 2 * pi / (len(df) + 1)
angles = pi/2 - 3*big_angle/2 - array(df.index) * big_angle

df["start"] = angles
df["end"] = angles + big_angle
df["colors"] = [GRAM[gram] for gram in df.gram]

source = ColumnDataSource(df)

# Burtin's unusual inverted radial sqrt-log scale
micmin = sqrt(log(.001*1E4))
micmax = sqrt(log(1000*1E4))
def scale(mic):
    return - sqrt(log(mic * 1E4)) + (micmin + micmax)

p = figure(
    width=800, height=800, title=None, tools="", toolbar_location=None,
    x_axis_type=None, y_axis_type=None, match_aspect=True,
    min_border=0, outline_line_color="black", background_fill_color="#f0e1d2",
)

# large wedges for bacteria
br = p.annular_wedge(0, 0, micmax, micmin, "start", "end", fill_color="colors", line_color="#f0e1d2", source=source)

# circular axes and labels
radii = scale(10.0 ** arange(-3, 4))
p.circle(0, 0, radius=radii, fill_color=None, line_color="#f0e1d2")
p.text(
    0, radii, ["0.001", "0.01", "0.1", "1", "10", "100", "1000"],
    text_font_size="12px", anchor="center",
)

# small wedges for drugs
small_angle = big_angle / 7
for i, drug in enumerate(DRUGS):
    start = angles+(5-2*i)*small_angle
    end = angles+(6-2*i)*small_angle
    p.annular_wedge(
        0, 0, micmin, scale(df[drug]), start, end,
        color=COLORS[i], line_color=None, legend_label=drug,
    )

# bacteria labels
r = radii[0] * 1.1
xr = r * cos(angles + big_angle/2)
yr = r * sin(angles + big_angle/2)
p.text(
    xr, yr, ["\n".join(x.split()) for x in df.bacteria],
    text_font_size="13px", anchor="center",
)

p.legend.location = "center"
p.legend.background_fill_alpha = 0
p.legend.glyph_width = 45
p.legend.glyph_height = 20

p.x_range.range_padding = 0.2
p.y_range.range_padding = 0.2

p.grid.grid_line_color = None

legend = Legend(items=[
    LegendItem(label="Gram-positive", renderers=[br], index=10),
    LegendItem(label="Gram-negative", renderers=[br], index=0),
], location="bottom", orientation="horizontal", background_fill_alpha=0)
p.add_layout(legend, 'center')

show(p)
