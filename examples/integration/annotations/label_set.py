from bokeh.io import save
from bokeh.models import ColumnDataSource, LabelSet, LinearAxis, Plot, Range1d

source = ColumnDataSource(data=dict(text=['one', 'two', 'three'],
                                    x1=[1,4,7],
                                    x2=[60,240,420]))

# Have to specify x/y range as labels aren't included in the plot area solver
plot = Plot(plot_width=600, plot_height=600,
            x_range=Range1d(0, 10), y_range=Range1d(0, 10),
            toolbar_location=None)

label_set1 = LabelSet(x='x1', y=2, x_offset=25, y_offset=25,
                      text="text", source=source,
                      text_font_size='50px', text_color='red', text_alpha=0.9,
                      text_baseline='bottom', text_align='left',
                      background_fill_color='green', background_fill_alpha=0.2,
                      angle=15, angle_units='deg',
                      render_mode='canvas')

label_set2 = LabelSet(x='x2', y=4, x_units='screen', x_offset=25, y_offset=25,
                      text="text", source=source,
                      text_font_size='50px', text_color='red', text_alpha=0.9,
                      text_baseline='bottom', text_align='left',
                      background_fill_color='green', background_fill_alpha=0.2,
                      angle=15, angle_units='deg',
                      render_mode='css')

plot.add_layout(LinearAxis(), 'below')
plot.add_layout(LinearAxis(), 'left')

plot.add_layout(label_set1)
plot.add_layout(label_set2)

save(plot)
