''' Set a scatter plot title when creating the figure.

.. bokeh-example-metadata::
    :title: Title basic
    :keywords: title basic, basic plotting, annotations
    :apis: bokeh.plotting.figure.scatter
'''

from bokeh.plotting import figure, show

p = figure(title="Basic Title", width=300, height=300)

p.scatter([1, 2], [3, 4])

show(p)
