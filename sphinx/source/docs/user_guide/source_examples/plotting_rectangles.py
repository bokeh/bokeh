from bokeh.plotting import figure, show, output_file

output_file('rectangles.html')

p = figure(width=400, height=400)
p.quad(top=[2, 3, 4], bottom=[1, 2, 3], left=[1, 2, 3],
       right=[1.2, 2.5, 3.7], color="#B3DE69")

show(p)
