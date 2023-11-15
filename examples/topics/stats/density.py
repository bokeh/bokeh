''' A `multiple kernel density estimation`_ plot of the "cows" data using
the `sklearn.neighbors.KernelDensity`_ function and `Bokeh` varea glyph

.. bokeh-example-metadata::
    :sampledata: cows
    :apis: bokeh.plotting.figure.varea
    :refs: :ref:`ug_topics_stats_density`
    :keywords: density, varea

.. _kernel density estimation: https://en.wikipedia.org/wiki/Kernel_density_estimation
.. _sklearn.neighbors.KernelDensity: https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.KernelDensity.html

'''
import numpy as np
import pandas as pd
from sklearn.neighbors import KernelDensity

from bokeh.models import ColumnDataSource, CustomJSTickFormatter, Label
from bokeh.palettes import Dark2
from bokeh.plotting import figure, show
from bokeh.sampledata.cows import data as df

grouped = df.groupby('breed')
colors = Dark2[5]
x = np.linspace(2, 8, 1000)
source = ColumnDataSource(dict(x=x))

p = figure(title="Multiple density estimates", height=300, x_range=(2.5, 7.5), x_axis_label="butterfat contents", y_axis_label="density")    

for i, (breed, group_df) in enumerate(grouped):
    data = group_df['butterfat'].values
    kde = KernelDensity(kernel="gaussian", bandwidth=0.2).fit(data[:, np.newaxis])
    log_dens = kde.score_samples(x[:, np.newaxis])
    y = np.exp(log_dens)
    source.add(y, breed)
    p.varea(x="x", y1=breed, y2=0, source=source, fill_alpha=0.3, fill_color=colors[i])

    # Find the highest point and annotate with the label
    max_idx = np.argmax(y)
    highest_point_label = Label(
        x=x[max_idx],
        y=y[max_idx],
        text=breed,
        text_font_size="10pt",
        x_offset=10,
        y_offset=-5,
        text_color=colors[i],
    )
    p.add_layout(highest_point_label)

# Convert x-axis labels to percentages
x_axis_labels = {3: "3%", 4: "4%", 5: "5%", 6: "6%", 7: "7%"}
p.xaxis.formatter = CustomJSTickFormatter(code="""var labels = %s; return labels[tick] || '';""" % x_axis_labels)

p.axis.axis_line_color = None
p.axis.major_tick_line_color = None
p.axis.minor_tick_line_color = None

p.xgrid.grid_line_color = None
p.yaxis.ticker = (0, 0.5, 1, 1.5)
p.y_range.start = 0

show(p)
