''' A `multiple kernel density estimation`_ plot of the "cows" data using
the `sklearn.neighbors.KernelDensity`_ function and `Bokeh` varea glyph

.. bokeh-example-metadata::
    :sampledata: cows
    :apis: bokeh.plotting.figure.varea
    :refs: :ref:`ug_topics_stats_kde`
    :keywords: density, varea

.. _multiple kernel density estimation: https://en.wikipedia.org/wiki/Kernel_density_estimation
.. _sklearn.neighbors.KernelDensity: https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.KernelDensity.html

'''
import numpy as np
from sklearn.neighbors import KernelDensity

from bokeh.models import ColumnDataSource, Label, PrintfTickFormatter
from bokeh.palettes import Dark2_5 as colors
from bokeh.plotting import figure, show
from bokeh.sampledata.cows import data as df

breed_groups = df.groupby('breed')
x = np.linspace(2, 8, 1000)
source = ColumnDataSource(dict(x=x))

p = figure(title="Multiple density estimates", height=300, x_range=(2.5, 7.5), x_axis_label="butterfat contents", y_axis_label="density")

for (breed, breed_df), color in zip(breed_groups, colors):
    data = breed_df['butterfat'].values
    kde = KernelDensity(kernel="gaussian", bandwidth=0.2).fit(data[:, np.newaxis])
    log_density = kde.score_samples(x[:, np.newaxis])
    y = np.exp(log_density)
    source.add(y, breed)
    p.varea(x="x", y1=breed, y2=0, source=source, fill_alpha=0.3, fill_color=color)

    # Find the highest point and annotate with a label
    max_idx = np.argmax(y)
    highest_point_label = Label(
        x=x[max_idx],
        y=y[max_idx],
        text=breed,
        text_font_size="10pt",
        x_offset=10,
        y_offset=-5,
        text_color=color,
    )
    p.add_layout(highest_point_label)

# Display x-axis labels as percentages
p.xaxis.formatter = PrintfTickFormatter(format="%d%%")

p.axis.axis_line_color = None
p.axis.major_tick_line_color = None
p.axis.minor_tick_line_color = None

p.xgrid.grid_line_color = None
p.yaxis.ticker = (0, 0.5, 1, 1.5)
p.y_range.start = 0

show(p)
