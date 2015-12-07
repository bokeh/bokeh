"""
Example demonstrating the picking of line objects.
"""

import numpy as np
from bokeh.plotting import output_file, show, figure, Figure
from bokeh.models import TapTool, CustomJS, ColumnDataSource

# The data is setup to have very different scales in x and y, to verify
# that picking happens in pixels. Different widths are used to test that
# you can click anywhere on the visible line.

code = """
d0 = cb_obj.get("selected")["0d"];
if (d0.glyph) {
    var color = d0.glyph.visuals.line.color.value();
    var data = source.get('data');
    data['text'] = ['Selected the ' + color + ' line'];
    source.trigger('change');
}
"""

p = figure()
t = np.linspace(0, 0.1, 100)
l1 = p.line(t, 100*np.sin(t*50), color='red', line_width=25)
l2 = p.line(t, 100*np.sin(t*50+1), color='green', line_width=5)
l3 = p.line(t, 100*np.sin(t*50+2), color='blue',  line_width=1)

# We use a source to easily update the text of the text-glyph
source = ColumnDataSource(data=dict(x=[0], y=[-100], text=['no line selected']))
t = p.text(source=source)

p.tools.append(TapTool(plot=p, callback=CustomJS(code=code, args={'source': source})))

output_file("line_select.html")
show(p)
