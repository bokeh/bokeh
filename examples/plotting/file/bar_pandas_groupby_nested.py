from bokeh.io import show, output_file
from bokeh.plotting import figure
from bokeh.palettes import Spectral5
from bokeh.sampledata.autompg import autompg_clean as df
from bokeh.transform import factor_cmap

output_file("bar_pandas_groupby_nested.html")

df.cyl = df.cyl.astype(str)
df.yr = df.yr.astype(str)

group = df.groupby(('cyl', 'mfr'))

index_cmap = factor_cmap('cyl_mfr', palette=Spectral5, factors=sorted(df.cyl.unique()), end=1)

p = figure(plot_width=800, plot_height=300, title="Mean MPG by # Cylinders and Manufacturer",
           x_range=group, toolbar_location=None, tooltips=[("MPG", "@mpg_mean"), ("Cyl, Mfr", "@cyl_mfr")])

p.vbar(x='cyl_mfr', top='mpg_mean', width=1, source=group,
       line_color="white", fill_color=index_cmap, )

p.y_range.start = 0
p.x_range.range_padding = 0.05
p.xgrid.grid_line_color = None
p.xaxis.axis_label = "Manufacturer grouped by # Cylinders"
p.xaxis.major_label_orientation = 1.2
p.outline_line_color = None

show(p)
