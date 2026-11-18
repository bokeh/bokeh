''' Customize the line and fill properties of a glyph.

.. bokeh-example-metadata::
    :title: Glyph properties
    :keywords: glyph properties, appearance, plots
    :apis: bokeh.plotting.figure.scatter
'''

from bokeh.plotting import figure, show

p = figure(width=400, height=400)
r = p.scatter([1,2,3,4,5], [2,5,8,2,7])

glyph = r.glyph
glyph.size = 60
glyph.fill_alpha = 0.2
glyph.line_color = "firebrick"
glyph.line_dash = [6, 3]
glyph.line_width = 2

show(p)
