import pandas as pd
from bokeh.charts import Line, show, output_file, vplot, hplot

data = dict(python=[2, 3, 7, 5, 26, 221, 44, 233, 254, 265, 266, 267, 120, 111],
            pypy=[12, 33, 47, 15, 126, 121, 144, 233, 254, 225, 226, 267, 110, 130],
            jython=[22, 43, 10, 25, 26, 101, 114, 203, 194, 215, 201, 227, 139, 160]
            )

df = pd.DataFrame(data)
df['date'] = pd.date_range('1/1/2015', periods=len(df.index), freq='D')

# any of the following commented are also valid Line inputs
#xyvalues = pd.DataFrame(xyvalues)
#xyvalues = xyvalues.values()
#xyvalues = np.array(xyvalues.values())

output_file("lines.html", title="line.py example")

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

show(
    vplot(
        hplot(line0, line1),
        hplot(line2, line3)
    )
)
