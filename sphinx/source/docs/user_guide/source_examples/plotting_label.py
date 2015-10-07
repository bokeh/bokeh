from bokeh.sampledata.iris import flowers
from bokeh.models.annotations import Label
from bokeh.plotting import figure, show, output_file

flowers = flowers[flowers.species != 'setosa'] # drop setosa species
colormap = {'versicolor': 'green', 'virginica': 'blue'}
flowers['color'] = flowers['species'].map(lambda x: colormap[x])

output_file("label.html", title="label.py example")

p = figure(title = "Iris Morphology")
p.xaxis.axis_label = 'Petal Length'
p.yaxis.axis_label = 'Petal Width'

p.circle(flowers["petal_length"], flowers["petal_width"],
        color=flowers["color"], fill_alpha=0.2, size=10)
p.line(x=[3, 7], y=[2.25, 1.05], color='black', line_dash='dashed')

label_props = dict(level='underlay',
                   label_text_font_size='50pt',
                   label_text_align='center',
                   label_text_color='#CFCFCF')

versicolor_label = Label(text='Versicolor', x=4.5, y=1.2, **label_props)
virginica_label = Label(text='Virginica', x=5.5, y=2.1, **label_props)

p.renderers.extend([versicolor_label, virginica_label])

show(p)
