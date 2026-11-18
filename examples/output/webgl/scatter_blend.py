''' Draw the penguins dataset twice to compare how overlapping translucent markers
blend in WebGL.

.. bokeh-example-metadata::
    :title: Blend translucent markers
    :keywords: scatter, blend, webgl
    :apis: bokeh.plotting.figure.scatter
    :sampledata: penguins
    :gallery: Two overlaid scatter plots of penguin measurements show how translucent markers blend.
'''

from bokeh.plotting import figure, show
from bokeh.sampledata.penguins import data

colormap1 = {'Adelie': 'rgb(255, 0, 0)',
             'Chinstrap': 'rgb(0, 255, 0)',
             'Gentoo': 'rgb(0, 0, 255)'}
colors1 = [colormap1[x] for x in data['species']]

colormap2 = {'Adelie': '#0f0', 'Chinstrap': '#0f0', 'Gentoo': '#f00'}
colors2 = [colormap2[x] for x in data['species']]

p = figure(output_backend="webgl")

p.scatter(data["flipper_length_mm"], data["body_mass_g"], marker="diamond",
          color=colors1, line_alpha=0.5, fill_alpha=0.2, size=25, legend_label='diamonds')

p.scatter(data["flipper_length_mm"], data["body_mass_g"],
          color=colors2, line_alpha=0.5, fill_alpha=0.2, size=10, legend_label='circles')

show(p)
