''' Add a second, centered title below a plot that already has a title on the left.

.. bokeh-example-metadata::
    :title: Title additional
    :keywords: title additional, basic plotting, annotations
    :apis: bokeh.models.Title, bokeh.plotting.figure.add_layout, bokeh.plotting.figure.scatter
'''

from bokeh.models import Title
from bokeh.plotting import figure, show

p = figure(title="Left Title", title_location="left",
           width=300, height=300)

p.scatter([1, 2], [3, 4])

# add extra titles with add_layout(...)
p.add_layout(Title(text="Bottom Centered Title", align="center"), "below")

show(p)
