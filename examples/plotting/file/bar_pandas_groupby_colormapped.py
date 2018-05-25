from bokeh.io import show, output_file
from bokeh.palettes import Spectral5
from bokeh.plotting import figure
from bokeh.sampledata.autompg import autompg as df
from bokeh.transform import factor_cmap

output_file("bar_pandas_groupby_colormapped.html")

df.cyl = df.cyl.astype(str)
group = df.groupby('cyl')

cyl_cmap = factor_cmap('cyl', palette=Spectral5, factors=sorted(df.cyl.unique()))

p = figure(plot_height=350, x_range=group, title="MPG by # Cylinders",
           toolbar_location=None, tools="")

p.vbar(x='cyl', top='mpg_mean', width=1, source=group,
       line_color=cyl_cmap, fill_color=cyl_cmap)

p.y_range.start = 0
p.xgrid.grid_line_color = None
p.xaxis.axis_label = "some stuff"
p.xaxis.major_label_orientation = 1.2
p.outline_line_color = None

show(p)
