from bokeh.sampledata.iris import flowers
from bokeh.models import ColumnDataSource, PolyAnnotation
from bokeh.plotting import figure, show, output_file

flowers = flowers[flowers.species != 'setosa'] # drop setosa species
colormap = {'versicolor': 'green', 'virginica': 'blue'}
flowers['color'] = flowers['species'].map(lambda x: colormap[x])

output_file("label.html", title="label.py example")

p = figure(title = "Iris Morphology")
p.xaxis.axis_label = 'Petal Length'
p.yaxis.axis_label = 'Petal Width'

p.circle(flowers["petal_length"], flowers["petal_width"],
         color=flowers["color"], fill_alpha=0.3, size=10)

label_props = dict(label_text_font_size='40pt',
                   label_text_align='center',
                   label_text_alpha=0.5)

source = ColumnDataSource(data=dict(xs=[[3,3,7,7], [3,3,7,7]],
                                    ys=[[1,2.25,1.05,1], [2.25,2.5,2.5,1.05]],
                                    color=['green','blue']))

p.add_annotation(PolyAnnotation(xs='xs', ys='ys', fill_color='color',
                                fill_alpha=0.1, line_dash='8 4', line_width=3,
                                line_color='color', line_alpha=0.3, source=source))

show(p)
