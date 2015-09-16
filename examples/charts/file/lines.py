import pandas as pd
from bokeh.charts import Line, show, output_file, vplot, hplot
from bokeh.charts import defaults

defaults.width = 550
defaults.height = 350

# build a dataset where multiple columns measure the same thing
data = dict(python=[2, 3, 7, 5, 26, 221, 44, 233, 254, 265, 266, 267, 120, 111],
            pypy=[12, 33, 47, 15, 126, 121, 144, 233, 254, 225, 226, 267, 110, 130],
            jython=[22, 43, 10, 25, 26, 101, 114, 203, 194, 215, 201, 227, 139, 160],
            test=['foo', 'bar', 'foo', 'bar', 'foo', 'bar', 'foo', 'bar', 'foo', 'bar', 'foo', 'bar', 'foo', 'bar']
            )
df = pd.DataFrame(data)

# add a column with a range of dates, as if the values were sampled then
df['date'] = pd.date_range('1/1/2015', periods=len(df.index), freq='D')


# build the line plots
line0 = Line(df, y=['python', 'pypy', 'jython'],
             title="Interpreters (y=['python', 'pypy', 'jython'])", ylabel='Duration', legend=True)

line1 = Line(df, x='date', y=['python', 'pypy', 'jython'],
             title="Interpreters (x='date', y=['python', 'pypy', 'jython'])", ylabel='Duration', legend=True)

line2 = Line(df, x='date', y=['python', 'pypy', 'jython'],
             dash=['python', 'pypy', 'jython'],
             title="Interpreters (x='date', y, dash=['python', 'pypy', 'jython'])", ylabel='Duration', legend=True)

line3 = Line(df, x='date', y=['python', 'pypy', 'jython'],
             dash=['python', 'pypy', 'jython'],
             color=['python', 'pypy', 'jython'],
             title="Interpreters (x='date', y, dash, color=['python', 'pypy', 'jython'])", ylabel='Duration', legend=True)

line4 = Line(df, x='date', y=['python', 'pypy', 'jython'],
             dash='test',
             color=['python', 'pypy', 'jython'],
             title="Interpreters (x='date', y, color=['python', 'pypy', 'jython'], dash='test')", ylabel='Duration',
             legend=True)


output_file("lines.html", title="line.py example")


show(
    vplot(
        hplot(line0, line1),
        hplot(line2, line3),
        hplot(line4)
    )
)
