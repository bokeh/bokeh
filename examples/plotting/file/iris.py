''' A scatter plot using `Fisher's Iris dataset <https://en.wikipedia.org/wiki/Iris_flower_data_set>`_ to illustrate
colormapping and basic plot elements. The chart shows correlation between petal width and length for three different
iris species.

.. rubric:: Details

:sampledata: :ref:`sampledata_iris`
:bokeh APIs: :func:`~bokeh.plotting.Figure.circle`
:references: :ref:`userguide_plotting_scatter_markers`
:keywords: scatter, alpha

|

'''
from bokeh.plotting import figure, show
from bokeh.sampledata.iris import flowers

colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}
colors = [colormap[x] for x in flowers['species']]

p = figure(title="Iris Morphology")
p.xaxis.axis_label = 'Petal Length'
p.yaxis.axis_label = 'Petal Width'

p.circle(flowers["petal_length"], flowers["petal_width"],
         color=colors, fill_alpha=0.2, size=10)

show(p)
