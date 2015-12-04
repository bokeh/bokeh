from collections import OrderedDict

from bokeh.charts import Dot, show, output_file

# create some example data
xyvalues = OrderedDict(
    python=[2, 3, 7, 5, 26],
    pypy=[12, 33, 47, 15, 126],
    jython=[22, 43, 10, 25, 26],
)

output_file("dots.html")

from bokeh.charts import Bar, output_file, show, hplot

# best support is with data in a format that is table-like
data = {
    'sample': ['1st', '2nd', '1st', '2nd', '1st', '2nd'],
    'interpreter': ['python', 'python', 'pypy', 'pypy', 'jython', 'jython'],
    'timing': [-2, 5, 12, 40, 22, 30]
}

# x-axis labels pulled from the interpreter column, stacking labels from sample column
dots = Dot(data, values='timing', label='interpreter', group='sample', agg='mean',
          title="Python Interpreter Sampling", legend='top_right', width=600)

show(dots)
