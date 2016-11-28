from bokeh.plotting import figure, show, output_file

output_file('vbar.html')

p = figure(width=400, height=400)
p.vbar(x=[1, 2, 3], width=0.5, bottom=0,
       top=[1.2, 2.5, 3.7], color="firebrick")

show(p)
