from bokeh.plotting import figure, output_file, show

p = figure(title="Basic Title", width=300, height=300)
p.circle([1,2], [3,4])

output_file("title.html")

show(p)
