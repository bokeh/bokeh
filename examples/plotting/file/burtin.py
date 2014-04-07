import numpy as np
import pandas as pd
from bokeh.plotting import *
from bokeh.objects import Range1d
from six.moves import cStringIO as StringIO
from math import log, sqrt
from collections import OrderedDict

antibiotics = """
bacteria,                        penicillin, streptomycin, neomycin, gram
Mycobacterium tuberculosis,      800,        5,            2,        negative
Salmonella schottmuelleri,       10,         0.8,          0.09,     negative
Proteus vulgaris,                3,          0.1,          0.1,      negative
Klebsiella pneumoniae,           850,        1.2,          1,        negative
Brucella abortus,                1,          2,            0.02,     negative
Pseudomonas aeruginosa,          850,        2,            0.4,      negative
Escherichia coli,                100,        0.4,          0.1,      negative
Salmonella (Eberthella) typhosa, 1,          0.4,          0.008,    negative
Aerobacter aerogenes,            870,        1,            1.6,      negative
Brucella antracis,               0.001,      0.01,         0.007,    positive
Streptococcus fecalis,           1,          1,            0.1,      positive
Staphylococcus aureus,           0.03,       0.03,         0.001,    positive
Staphylococcus albus,            0.007,      0.1,          0.001,    positive
Streptococcus hemolyticus,       0.001,      14,           10,       positive
Streptococcus viridans,          0.005,      10,           40,       positive
Diplococcus pneumoniae,          0.005,      11,           10,       positive
"""

drug_color = OrderedDict([
    ("Penicillin",   "#0d3362"),
    ("Streptomycin", "#c64737"),
    ("Neomycin",     "black"  ),
])

gram_color = {
    "positive" : "#aeaeb8",
    "negative" : "#e69584",
}

df = pd.read_csv(StringIO(antibiotics), skiprows=1, skipinitialspace=True)

width = 800
height = 800
inner_radius = 90
outer_radius = 300 - 10

minr = sqrt(log(.001 * 1E4))
maxr = sqrt(log(1000 * 1E4))
a = (outer_radius - inner_radius) / (minr - maxr)
b = inner_radius - a * maxr

def rad(mic):
    return a * np.sqrt(np.log(mic * 1E4)) + b

big_angle = 2.0 * np.pi / (len(df) + 1)
small_angle = big_angle / 7

output_file("burtin.html", title="burtin.py example")

hold()

x = np.zeros(len(df))
y = np.zeros(len(df))

line(x+1, y+1, alpha=0, plot_width=width, plot_height=height, title="", tools="pan,wheel_zoom,box_zoom,reset,previewsave", x_axis_type=None, y_axis_type=None)

plot = curplot()
plot.x_range = Range1d(start=-420, end=420)
plot.y_range = Range1d(start=-420, end=420)
plot.min_border = 0
plot.background_fill = "#f0e1d2"
plot.border_fill = "#f0e1d2"
plot.outline_line_color = None

# annular wedges
angles = np.pi/2 - big_angle/2 - df.index*big_angle
colors = [gram_color[gram] for gram in df.gram]
annular_wedge(
    x, y, inner_radius, outer_radius, -big_angle+angles, angles, color=colors,
)

# small wedges
annular_wedge(
    x, y, inner_radius, rad(df.penicillin), -big_angle+angles + 5*small_angle, -big_angle+angles+6*small_angle, color=drug_color['Penicillin'],
)
annular_wedge(
    x, y, inner_radius, rad(df.streptomycin), -big_angle+angles + 3*small_angle, -big_angle+angles+4*small_angle, color=drug_color['Streptomycin'],
)
annular_wedge(
    x, y, inner_radius, rad(df.neomycin), -big_angle+angles + 1*small_angle, -big_angle+angles+2*small_angle, color=drug_color['Neomycin'],
)

# circular axes and lables
labels = np.power(10.0, np.arange(-3, 4))
radii = a * np.sqrt(np.log(labels * 1E4)) + b
circle(x, y, radius=radii, fill_color=None, line_color="white")
text(x[:-1], radii[:-1], [str(r) for r in labels[:-1]], angle=0, text_font_size="8pt", text_align="center", text_baseline="middle")

# radial axes
annular_wedge(
    x, y, inner_radius-10, outer_radius+10, -big_angle+angles, -big_angle+angles, color="black",
)

# bacteria labels
xr = radii[0]*np.cos(np.array(-big_angle/2 + angles))
yr = radii[0]*np.sin(np.array(-big_angle/2 + angles))
label_angle=np.array(-big_angle/2+angles)
label_angle[label_angle < -np.pi/2] += np.pi # easier to read labels on the left side
text(xr, yr, df.bacteria, angle=label_angle, text_font_size="9pt", text_align="center", text_baseline="middle")

# OK, these hand drawn legends are pretty clunky, will be improved in future release
circle([-40, -40], [-370, -390], color=list(gram_color.values()), radius=5)
text([-30, -30], [-370, -390], text=["Gram-" + x for x in gram_color.keys()], angle=0, text_font_size="7pt", text_align="left", text_baseline="middle")

rect([-40, -40, -40], [18, 0, -18], width=30, height=13,
        color=list(drug_color.values()))
text([-15, -15, -15], [18, 0, -18], text=list(drug_color.keys()), angle=0, text_font_size="9pt", text_align="left", text_baseline="middle")

xgrid().grid_line_color = None
ygrid().grid_line_color = None

show()
