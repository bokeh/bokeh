'''An example of linked panning with three scatter plots.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.scatter
    :refs: :ref:`ug_basic_scatters_markers`
    :keywords: scatter, linked panning

'''
from bokeh.layouts import gridplot
from bokeh.plotting import figure, show

x = list(range(21))
y0 = x
y1 = [20-xx for xx in x]
y2 = [abs(xx-10) for xx in x]

# create a new plot
s1 = figure(width=250, height=250, title=None)
s1.scatter(x, y0, size=10, color="navy", alpha=0.5)

# create a new plot and share both ranges
s2 = figure(width=250, height=250, x_range=s1.x_range, y_range=s1.y_range, title=None)
s2.scatter(x, y1, size=10, marker="triangle", color="firebrick", alpha=0.5)

# create a new plot and share only one range
s3 = figure(width=250, height=250, x_range=s1.x_range, title=None)
s3.scatter(x, y2, size=10, marker="square", color="olive", alpha=0.5)

p = gridplot([[s1, s2, s3]], toolbar_location=None)

show(p)
