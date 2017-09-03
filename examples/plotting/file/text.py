from bokeh.plotting import figure, show, output_file

plot = figure(x_range=(-2, 12), y_range=(-1, 4), plot_width=1000, plot_height=1000, toolbar_location=None)

plot.xgrid.grid_line_color = None
plot.ygrid.grid_line_color = None

texts = ["abc", "abc\ndefghi", "abc\ndefghi\nj", "abc\ndefghi\nj\nklmnpqr"]

def xs(start):
    return [ start + i*0.75 for i in range(0, len(texts)) ]

plot.text([0, 4, 8], [-0.5]*3, ["baseline: bottom", "baseline: middle", "baseline: top"],
          text_font_style="bold", text_font_size="16px")

plot.text([-1]*4, [0, 1, 2, 3], ["align: left", "align: center", "align: right", "angle: 25deg"],
          angle=dict(value=90, units="deg"),
          text_font_style="bold", text_font_size="16px")

plot.text(xs(0), [0]*len(texts), texts,
          text_align="left", text_baseline="bottom", text_font_size="14px", text_line_height=1.2)
plot.text(xs(4), [0]*len(texts), texts,
          text_align="left", text_baseline="middle", text_font_size="14px", text_line_height=1.2)
plot.text(xs(8), [0]*len(texts), texts,
          text_align="left", text_baseline="top", text_font_size="14px", text_line_height=1.2)

plot.text(xs(0), [1]*len(texts), texts,
          text_align="center", text_baseline="bottom", text_font_size="14px", text_line_height=1.2)
plot.text(xs(4), [1]*len(texts), texts,
          text_align="center", text_baseline="middle", text_font_size="14px", text_line_height=1.2)
plot.text(xs(8), [1]*len(texts), texts,
          text_align="center", text_baseline="top", text_font_size="14px", text_line_height=1.2)

plot.text(xs(0), [2]*len(texts), texts,
          text_align="right", text_baseline="bottom", text_font_size="14px", text_line_height=1.2)
plot.text(xs(4), [2]*len(texts), texts,
          text_align="right", text_baseline="middle", text_font_size="14px", text_line_height=1.2)
plot.text(xs(8), [2]*len(texts), texts,
          text_align="right", text_baseline="top", text_font_size="14px", text_line_height=1.2)

angle = dict(value=25, units="deg")

plot.text(xs(0), [3]*len(texts), texts, angle=angle,
          text_align="left", text_baseline="bottom", text_font_size="14px", text_line_height=1.2)
plot.text(xs(4), [3]*len(texts), texts, angle=angle,
          text_align="left", text_baseline="middle", text_font_size="14px", text_line_height=1.2)
plot.text(xs(8), [3]*len(texts), texts, angle=angle,
          text_align="left", text_baseline="top", text_font_size="14px", text_line_height=1.2)

output_file("text.html", "Variations on the display of text")
show(plot)
