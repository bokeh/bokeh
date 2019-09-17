from bokeh.plotting import figure
from bokeh.layouts import gridplot
from bokeh.io import show

x_range = ['a', 'b', 'c', 'd']
y_values = [1., 2., 3., 4.]
y_errors = [.1, .2, .3, .4]

err_xs = []
err_ys = []

for x, y, yerr in zip(x_range, y_values, y_errors):
    err_xs.append((x, x))
    err_ys.append((y - yerr, y + yerr))

p1 = figure(x_range=x_range, title="multi_line", plot_width=300, plot_height=300)
p1.square(x_range, y_values, size=7, line_alpha=0)

p1.multi_line(err_xs, err_ys)

p2 = figure(x_range=x_range, title="line", plot_width=300, plot_height=300)
p2.square(x_range, y_values, size=7, line_alpha=0)
for i in range(len(err_xs)):
    p2.line(err_xs[i], err_ys[i])


patch1_x = ['foo','bar','bar','foo']
patch1_y = [1,1,2,2]

patch2_x = ['bar','ting','bar','foo']
patch2_y = [2,2,4,4]

patch_list_x = [patch1_x, patch2_x]
patch_list_y = [patch1_y, patch2_y]

p3 = figure(x_range=['foo', 'bar', 'ting'], y_range=(0, 5), title="patches", plot_width=300, plot_height=300)
p3.patches(patch_list_x, patch_list_y)

p4 = figure(x_range=['foo', 'bar', 'ting'], y_range=(0, 5), title="patch", plot_width=300, plot_height=300)
p4.patch(patch1_x, patch1_y)
p4.patch(patch2_x, patch2_y)

show(gridplot([[p1, p2], [p3, p4]], merge_tools=False))
