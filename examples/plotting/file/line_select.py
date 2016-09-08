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
d0 = cb_obj.selected["0d"];
if (d0.glyph) {
    var color = d0.get_view().visuals.line.line_color.value();
    var data = source.data;
    data['text'] = ['Selected the ' + color + ' line'];
    source.trigger('change');
}
"""

# use a source to easily update the text of the text-glyph
source = ColumnDataSource(data=dict(text=['no line selected']))

p = figure()

l1 = p.line(t, 100*np.sin(t*50), color='red', line_width=25)
l2 = p.line(t, 100*np.sin(t*50+1), color='green', line_width=5)
l3 = p.line(t, 100*np.sin(t*50+2), color='blue',  line_width=1)

p.text(0, -100, source=source)

p.add_tools(TapTool(callback=CustomJS(code=code, args=dict(source=source))))

output_file("line_select.html", title="line_select.py example")

show(p)
