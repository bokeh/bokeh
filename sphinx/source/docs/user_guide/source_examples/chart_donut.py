from bokeh.charts import Donut, output_file, show

output_file('donut.html')

# prepare the data
data = [[2., 5., 3.], [4., 1., 4.], [6., 4., 3.]]

donut = Donut(data, ['cpu1', 'cpu2', 'cpu3'])

show(donut)
