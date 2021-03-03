from bokeh.plotting import figure, output_file, show

p = figure(title="Top Title with Toolbar", toolbar_location="above",
           width=600, height=300)
p.circle([1,2], [3,4])

output_file("title.html")

show(p)
