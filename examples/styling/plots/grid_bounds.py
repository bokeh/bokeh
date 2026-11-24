''' Limit the range over which grid lines are drawn.

.. bokeh-example-metadata::
    :title: Grid bounds
    :keywords: grid, bounds
    :apis: bokeh.plotting.figure.scatter
    :gallery: Five scatter points with grid lines drawn only between 2 and 4 on each axis.
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.scatter([1,2,3,4,5], [2,5,8,2,7], size=10)

p.grids.bounds = (2, 4)

show(p)
