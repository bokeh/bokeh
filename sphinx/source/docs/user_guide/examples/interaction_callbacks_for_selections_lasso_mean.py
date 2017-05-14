from random import random
from bokeh.models import CustomJS, ColumnDataSource
from bokeh.plotting import figure, output_file, show

output_file("callback.html")

x = [random() for x in range(500)]
y = [random() for y in range(500)]
color = ["navy"] * len(x)

s = ColumnDataSource(data=dict(x=x, y=y, color=color))
p = figure(plot_width=400, plot_height=400, tools="lasso_select", title="Select Here")
p.circle('x', 'y', color='color', size=8, source=s, alpha=0.4)

s2 = ColumnDataSource(data=dict(x=[0, 1], ym=[0.5, 0.5]))
p.line(x='x', y='ym', color="orange", line_width=5, alpha=0.6, source=s2)

s.callback = CustomJS(args=dict(s2=s2), code="""
        var inds = cb_obj.selected['1d'].indices;
        var d = cb_obj.data;
        var ym = 0

        if (inds.length == 0) { return; }

        for (i = 0; i < d['color'].length; i++) {
            d['color'][i] = "navy"
        }
        for (i = 0; i < inds.length; i++) {
            d['color'][inds[i]] = "firebrick"
            ym += d['y'][inds[i]]
        }

        ym /= inds.length
        s2.data['ym'] = [ym, ym]

        cb_obj.change.emit();
        s2.change.emit();
    """)

show(p)
