"""
Example demonstrating the picking of line objects.
"""

import numpy as np
from bokeh.plotting import output_file, show, figure, Figure
from bokeh.models import TapTool, CustomJS

code = """
d0 = cb_obj.get("selected")["0d"];
if (d0.glyph) {
    var color = d0.glyph.visuals.line.color.value();
    console.log('Selected line with color and id:', color, d0.glyph.id);
}
"""

# The data is setup to have very different scales in x and y, to verify
# that picking happens in pixels. Different widths are used to test that
# you can click anywhere on the visible line.

p = figure()
t = np.linspace(0, 0.1, 100)
l1 = p.line(t, 100*np.sin(t*50), color='#ff0000', selection_color='#000000', line_width=25)
l2 = p.line(t, 100*np.sin(t*50+1), color='#00ff00', selection_color='#000000', line_width=5)
l3 = p.line(t, 100*np.sin(t*50+2), color='#0000ff', selection_color='#000000', line_width=1)

p.tools.append(TapTool(plot=p, callback=CustomJS(code=code)))

output_file("line_select.html")
show(p)
