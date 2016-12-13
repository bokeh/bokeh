from bokeh.plotting import figure, show, output_file

output_file('hbar.html')

p = figure(width=400, height=400)
p.hbar(y=[1, 2, 3], height=0.5, left=0,
       right=[1.2, 2.5, 3.7], color="navy")

show(p)
