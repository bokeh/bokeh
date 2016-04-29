from bokeh.charts import Line, show, output_file

# build a dataset where multiple columns measure the same thing
data = dict(python=[2, 3, 7, 5, 26, 221, 44, 233, 254, 265, 266, 267, 120, 111],
            pypy=[12, 33, 47, 15, 126, 121, 144, 233, 254, 225, 226, 267, 110, 130],
            jython=[22, 43, 10, 25, 26, 101, 114, 203, 194, 215, 201, 227, 139, 160],
            test=['foo', 'bar', 'foo', 'bar', 'foo', 'bar', 'foo', 'bar', 'foo', 'bar',
                  'foo', 'bar', 'foo', 'bar']
            )

# create a line chart where each column of measures receives a unique color and dash style
line = Line(data, y=['python', 'pypy', 'jython'],
            dash=['python', 'pypy', 'jython'],
            color=['python', 'pypy', 'jython'],
            legend_sort_field = 'color',
            legend_sort_direction = 'ascending',
            title="Interpreter Sample Data", ylabel='Duration', legend=True)

output_file("line_single.html", title="line_single.py example")

show(line)
