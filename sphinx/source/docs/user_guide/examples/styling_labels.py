from bokeh.plotting import figure, output_file, show

output_file("bounds.html")

p = figure(plot_width=400, plot_height=400)
p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

p.x_axis.axis_label = "Lot Number"
p.x_axis.axis_label_text_color = "#aa6666"
p.x_axis.axis_label_standoff = 30

p.y_axis.axis_label = "Bin Count"
p.y_axis.axis_label_text_font_style = "italic"

show(p)
