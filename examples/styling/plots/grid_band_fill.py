''' Fill alternating bands between grid lines.

.. bokeh-example-metadata::
    :title: Shade alternating grid bands
    :keywords: grid, band, fill
    :apis: bokeh.plotting.figure.scatter
    :gallery: Five blue scatter points over alternating shaded horizontal grid bands.
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400)
p.scatter([1,2,3,4,5], [2,5,8,2,7], size=10)

# change just some things about the x-grid
p.xgrid.grid_line_color = None

# change just some things about the y-grid
p.ygrid.band_fill_alpha = 0.1
p.ygrid.band_fill_color = "navy"

show(p)
