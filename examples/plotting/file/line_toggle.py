"""
Example demonstrating the picking of line objects. The transparency of
the lines is toggled when clicked.
"""

import numpy as np
from bokeh.plotting import output_file, show, figure, Figure
from bokeh.models import TapTool, CustomJS

# Normally, the use of the tap tool causes Bokehjs to "select" a line
# when it is clicked on, which is not what we want in this example. To
# deal with this, we modify the "selected" object to make it look as
# if no glyph was clicked.

code = """
d0 = cb_obj.get("selected")["0d"];
if (d0.glyph) {
    var alpha = d0.glyph.visuals.line.alpha.value();
    var color = d0.glyph.visuals.line.color.value();
    console.log('Toggled line', d0.glyph.id, color);
    d0.glyph.visuals.line.alpha.fixed_value = (alpha == 1) ? 0.5 : 1.0;
    d0.glyph = false;  // Prevent the glyph from being selected.
}
"""

# The data is setup to have very different scales in x and y, to verify
# that picking happens in pixels.

p = figure()
t = np.linspace(0, 0.1, 100)
l1 = p.line(t, 100*np.sin(t*50), color='#ff0000', line_width=25)
l2 = p.line(t, 100*np.sin(t*50+1), color='#00ff00', line_width=5)
l3 = p.line(t, 100*np.sin(t*50+2), color='#0000ff', line_width=1)

p.tools.append(TapTool(plot=p, callback=CustomJS(code=code)))

output_file("line_toggle.html")
show(p)
