import numpy as np

from bokeh.plotting import output_file, show, figure
from bokeh.models import ColumnDataSource, HoverTool, TapTool
from bokeh.layouts import gridplot
from bokeh.palettes import Spectral6

output_file('multi_line.html')

PLOT_DEFAULTS = dict(plot_width=450, plot_height=300)

from collections import defaultdict

from scipy.stats import norm

mass_spec = defaultdict(list)

RT_x = np.linspace(118, 123, num=50)
norm_dist = norm(loc=120.4).pdf(RT_x)

# Generate several gaussian distributions and spectral lines
for scale, mz in [(1.0, 83), (0.9, 55), (0.6, 98), (0.4, 43), (0.2, 39), (0.12, 29)]:
    mass_spec["RT"].append(RT_x)
    mass_spec["RT_intensity"].append(norm_dist*scale)
    mass_spec["MZ"].append([mz, mz])
    mass_spec["MZ_intensity"].append([0, scale])
    mass_spec['MZ_tip'].append(mz)
    mass_spec['Intensity_tip'].append(scale)

source = ColumnDataSource(mass_spec)

tooltips = [('MZ', '@MZ_tip'), ('Rel Intensity', '@Intensity_tip')]

rt_plot = figure(tools=[HoverTool(tooltips=tooltips, line_policy='next'), TapTool()], **PLOT_DEFAULTS)
rt_plot.multi_line(xs='RT', ys='RT_intensity', line_width=5, line_color=Spectral6, line_alpha=0.8, source=source)
rt_plot.xaxis.axis_label = "Retention Time (sec)"
rt_plot.yaxis.axis_label = "Intensity"

mz_plot = figure(tools=[HoverTool(tooltips=tooltips, line_policy='next'), TapTool()], **PLOT_DEFAULTS)
mz_plot.multi_line(xs='MZ', ys='MZ_intensity', line_width=5, line_color=Spectral6, line_alpha=0.8, source=source)
mz_plot.xaxis.axis_label = "MZ"
mz_plot.yaxis.axis_label = "Intensity"

show(gridplot([[rt_plot, mz_plot]]))
