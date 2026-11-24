''' A bivariate `kernel density estimation <https://en.wikipedia.org/wiki/Kernel_density_estimation>`__ plot of the "autompg" data using
the `scipy.stats.gaussian_kde <https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.gaussian_kde.html>`__ function and Bokeh contour renderers.

.. bokeh-example-metadata::
    :title: Two-dimensional density estimate
    :keywords: kde, contour
    :apis: bokeh.plotting.figure.contour
    :sampledata: autompg
    :refs: :ref:`ug_topics_stats_kde`
    :gallery: A bivariate kernel density estimation plot of the autompg data.


'''
import numpy as np
from scipy.stats import gaussian_kde

from bokeh.palettes import Blues9
from bokeh.plotting import figure, show
from bokeh.sampledata.autompg import autompg as df


def kde(x, y, N):
    xmin, xmax = x.min(), x.max()
    ymin, ymax = y.min(), y.max()

    X, Y = np.mgrid[xmin:xmax:N*1j, ymin:ymax:N*1j]
    positions = np.vstack([X.ravel(), Y.ravel()])
    values = np.vstack([x, y])
    kernel = gaussian_kde(values)
    Z = np.reshape(kernel(positions).T, X.shape)

    return X, Y, Z

x, y, z = kde(df.hp, df.mpg, 300)

p = figure(height=400, x_axis_label="hp", y_axis_label="mpg",
           background_fill_color="#fafafa", tools=None,
           title="Kernel density estimation plot of HP vs MPG")
p.grids.level = "overlay"
p.grids.grid_line_color = "black"
p.grids.grid_line_alpha = 0.05

palette = Blues9[::-1]
levels = np.linspace(np.min(z), np.max(z), 10)
p.contour(x, y, z, levels[1:], fill_color=palette, line_color=palette)

show(p)
