from bokeh.plotting import figure, show, output_file
from bokeh.models import ColumnDataSource, Range1d, Label

output_file("label.html", title="label.py example")

source = ColumnDataSource(data=dict(height=[66, 71, 72, 68, 58, 62],
                                    weight=[165, 189, 220, 141, 260, 174],
                                    names=['Mark', 'Amir', 'Matt', 'Greg',
                                           'Owen', 'Juan']))

p = figure(title='Dist. of 10th Grade Students at Lee High',
           x_range=Range1d(140, 275))
p.scatter(x='weight', y='height', size=8, source=source)

label = Label(x='weight', y='height', text='names', level='glyph',
              x_offset=5, y_offset=-5, source=source)
p.add_annotation(label)

show(p)
