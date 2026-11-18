''' Position a figure title and its toolbar above the plot.

.. bokeh-example-metadata::
    :title: Title toolbar
    :keywords: title toolbar, basic plotting, annotations
    :apis: bokeh.plotting.figure.scatter
'''

from bokeh.plotting import figure, show

p = figure(title="Top Title with Toolbar", toolbar_location="above",
           width=600, height=300)

p.scatter([1, 2], [3, 4])

show(p)
