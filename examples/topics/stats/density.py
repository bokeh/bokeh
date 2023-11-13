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

from bokeh.models import CustomJSTickFormatter, Label
from bokeh.plotting import figure, show
from bokeh.sampledata.cows import data as df

grouped = df.groupby('breed')

butterfat = []
for breed, group_df in grouped:
    values = group_df['butterfat'].values
    butterfat.append(values)

new_dict = {
    "values": [butterfat[0], butterfat[1], butterfat[2],butterfat[3], butterfat[4]],
    "bandwidths": [0.2, 0.2, 0.2, 0.2, 0.2],
    "colors": ["#409DFA", "#FF3399", "#AC5703", "#9E5205", "green"],
    "labels": ["Ayrshire", "Canadian", "Guernsey", "Holstein-Friesian", "Jersey"],
}

new_df = pd.DataFrame(new_dict)

p = figure(title="Density estimates of butterfat percentages in cows", height=400, x_axis_label="butterfat contents", y_axis_label="density")

positions = np.linspace(2, 8, 1000)
for _, row in new_df.iterrows():
    data, bandwidth, color, label = (row["values"], row["bandwidths"], row["colors"], row["labels"])

    kde = KernelDensity(kernel="gaussian", bandwidth=bandwidth).fit(data[:, np.newaxis])
    log_dens = kde.score_samples(positions[:, np.newaxis])

    p.varea(x=positions, y1=np.exp(log_dens), y2=0, fill_alpha=0.3, fill_color=color)

    # Find the highest point and annotate with the label
    max_idx = np.argmax(np.exp(log_dens))
    highest_point_label = Label(
        x=positions[max_idx],
        y=np.exp(log_dens[max_idx]),
        text=label,
        text_font_size="10pt",
        x_offset=10,
        y_offset=-5,
        text_color=color,
    )
    p.add_layout(highest_point_label)

# Convert x-axis labels to percentages
x_axis_labels = {3: "3%", 4: "4%", 5: "5%", 6: "6%", 7: "7%"}
p.xaxis.formatter = CustomJSTickFormatter(code="""var labels = %s; return labels[tick] || '';""" % x_axis_labels)

p.axis.axis_line_color = None
p.axis.major_tick_out = 0
p.axis.minor_tick_out = 0
p.axis.major_tick_in = 0

p.x_range.start = 2.5
p.x_range.end = 7.5
p.xgrid.grid_line_color = None
p.yaxis.ticker = [0, 0.5, 1, 1.5]
p.y_range.start = 0

show(p)
