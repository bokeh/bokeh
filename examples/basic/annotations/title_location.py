''' Place the title along the left edge of a scatter plot.

.. bokeh-example-metadata::
    :title: Title location
    :keywords: title, location
    :apis: bokeh.plotting.figure.scatter
'''

from bokeh.plotting import figure, show

p = figure(title="Left Title", title_location="left",
           width=300, height=300)

p.scatter([1, 2], [3, 4])

show(p)
