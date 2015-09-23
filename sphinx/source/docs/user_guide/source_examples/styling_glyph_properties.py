from bokeh.plotting import figure, output_file, show

output_file("axes.html")

p = figure(plot_width=400, plot_height=400)
r = p.circle([1,2,3,4,5], [2,5,8,2,7])

glyph = r.glyph
glyph.size = 60
glyph.fill_alpha = 0.2
glyph.line_color = "firebrick"
glyph.line_dash = [6, 3]
glyph.line_width = 2

show(p)
