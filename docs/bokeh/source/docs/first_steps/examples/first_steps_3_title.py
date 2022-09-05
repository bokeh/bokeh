from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y = [6, 7, 2, 4, 5]

# create new plot
p = figure(title="Headline example")

# add line renderer with a legend
p.line(x, y, legend_label="Temp.", line_width=2)

# change headline location to the left
p.title_location = "left"

# change headline text
p.title.text = "Changing headline text example"

# style the headline
p.title.text_font_size = "25px"
p.title.align = "right"
p.title.background_fill_color = "darkgrey"
p.title.text_color = "white"

# show the results
show(p)
