""" Example demonstrating the picking of line objects.

"""

import numpy as np

from bokeh.models import TapTool, CustomJS, ColumnDataSource
from bokeh.plotting import output_file, show, figure

# The data is setup to have very different scales in x and y, to verify
# that picking happens in pixels. Different widths are used to test that
# you can click anywhere on the visible line.
#
# Note that the get_view() function used here is not documented and
# might change in future versions of Bokeh.
t = np.linspace(0, 0.1, 100)

code = """
// cb_data = {geometries: ..., source: ...}
v = cb_data.source.selected.get_view();
if (v) {
    var color = v.visuals.line.line_color.value();
    var data = source.data;
    data['text'] = ['Selected the ' + color + ' line'];
    data['text_color'] = [color];
    source.change.emit();
}
"""

# use a source to easily update the text of the text-glyph
source = ColumnDataSource(data=dict(text=['No line selected'], text_color=['black']))

p = figure(width=600, height=500)

l1 = p.line(t, 100*np.sin(t*50), color='goldenrod', line_width=30)
l2 = p.line(t, 100*np.sin(t*50+1), color='lightcoral', line_width=20)
l3 = p.line(t, 100*np.sin(t*50+2), color='royalblue', line_width=10)

p.text(0, -100, text_color='text_color', source=source)

p.add_tools(TapTool(callback=CustomJS(code=code, args=dict(source=source))))

output_file("line_select.html", title="line_select.py example")

show(p)
