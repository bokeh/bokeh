from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y1 = [4, 5, 5, 7, 2]
y2 = [2, 3, 4, 5, 6]

# create a new plot
p = figure(title="Legend example")

# add circle renderer with legend_label arguments
line = p.line(x, y1, legend_label="Temp.", line_color="blue", line_width=2)
circle = p.scatter(
    x,
    y2,
    marker="circle",
    size=80,
    legend_label="Objects",
    fill_color="red",
    fill_alpha=0.5,
    line_color="blue",
)

# display legend in top left corner (default is top right corner)
p.legend.location = "top_left"

# add a title to your legend
p.legend.title = "Observations"

# change appearance of legend text
p.legend.label_text_font = "times"
p.legend.label_text_font_style = "italic"
p.legend.label_text_color = "navy"

# change border and background of legend
p.legend.border_line_width = 3
p.legend.border_line_color = "navy"
p.legend.border_line_alpha = 0.8
p.legend.background_fill_color = "navy"
p.legend.background_fill_alpha = 0.2

# show the results
show(p)
