''' Spread daily temperatures for each month within a kernel density envelope
to form a sinaplot.

.. bokeh-example-metadata::
    :title: Sinaplot
    :keywords: jitter, scatter, sinaplot
    :apis: bokeh.plotting.figure.harea
    :sampledata: lincoln
    :refs: :ref:`ug_topics_stats_sinaplot`
    :gallery: Black points show daily temperatures grouped by month inside gray density envelopes.

.. _SinaPlot: https://orbit.dtu.dk/en/publications/sinaplot-an-enhanced-chart-for-simple-and-truthful-representation

'''
import numpy as np
import pandas as pd
from sklearn.neighbors import KernelDensity

from bokeh.plotting import figure, show
from bokeh.sampledata.lincoln import data as df

df["DATE"] = pd.to_datetime(df["DATE"])
df["TAVG"] = (df["TMAX"] + df["TMIN"]) / 2
df["MONTH"] = df.DATE.dt.strftime("%b")

months = list(df.MONTH.unique())

p = figure(
    height=400,
    width=600,
    x_range=months,
    x_axis_label="month",
    y_axis_label="mean temperature (F)",
)

# add a non-uniform categorical offset to a given category
def offset(category, data, scale=7):
    return list(zip([category] * len(data), scale * data))


for month in months:
    month_df = df[df.MONTH == month].dropna()
    tavg = month_df.TAVG.values
    temps = np.linspace(tavg.min(), tavg.max(), 50)

    kde = KernelDensity(kernel="gaussian", bandwidth=3).fit(tavg[:, np.newaxis])
    density = np.exp(kde.score_samples(temps[:, np.newaxis]))
    x1, x2 = offset(month, density), offset(month, -density)

    p.harea(x1=x1, x2=x2, y=temps, alpha=0.8, color="#E0E0E0")

    # pre-compute jitter in Python, this case is too complex for BokehJS
    tavg_density = np.exp(kde.score_samples(tavg[:, np.newaxis]))
    jitter = (np.random.random(len(tavg)) * 2 - 1) * tavg_density

    p.scatter(x=offset(month, jitter), y=tavg, color="black")

p.y_range.start = -10
p.yaxis.ticker = [0, 25, 50, 75]
p.grids.grid_line_color = None

show(p)
