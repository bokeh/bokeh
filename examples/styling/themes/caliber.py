''' Apply Bokeh's Caliber theme to a line plot.

.. bokeh-example-metadata::
    :title: Caliber
    :keywords: caliber, appearance, themes
    :apis: bokeh.plotting.figure.line
    :gallery:
    :thumbnail-alt: Basic line plot with the caliber theme.
'''

from bokeh.plotting import curdoc, figure, show

x = [1, 2, 3, 4, 5]
y = [6, 7, 6, 4, 5]

curdoc().theme = 'caliber'

p = figure(title='caliber', width=300, height=300)
p.line(x, y)

show(p)
