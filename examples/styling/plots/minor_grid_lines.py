''' Style minor grid lines separately from major grid lines.

.. bokeh-example-metadata::
    :title: Minor grid lines
    :keywords: minor, grid, lines
    :apis: bokeh.plotting.figure.scatter
    :gallery: Five scatter points on a grid with major and minor grid lines.
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.scatter([1,2,3,4,5], [2,5,8,2,7], size=10)

# change just some things about the y-grid
p.ygrid.minor_grid_line_color = 'navy'
p.ygrid.minor_grid_line_alpha = 0.1

show(p)
