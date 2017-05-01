""" Demonstration of how to register event callbacks using an adaptation
of the color_scatter example from the bokeh gallery
"""

import numpy as np

from bokeh.io import show, output_file
from bokeh.plotting import figure
from bokeh import events
from bokeh.models import CustomJS, Div, Button
from bokeh.layouts import column, row


def display_event(div, attributes=[]):
    """
    Function to build a suitable CustomJS to display the current event
    in the div model.
    """
    style = 'float:left;clear:left;font_size=0.5pt'
    return CustomJS(args=dict(div=div), code="""
        var attrs = %s;
        var args = [];
        for (var i=0; i<attrs.length; i++ ) {
            args.push(attrs[i] + '=' + Number(cb_obj[attrs[i]]).toFixed(2));
        }
        var line = "<span style=%r><b>" + cb_obj.event_name + "</b>(" + args.join(", ") + ")</span>\\n";
        var text = div.text.concat(line);
        var lines = text.split("\\n")
        if ( lines.length > 35 ) { lines.shift(); }
        div.text = lines.join("\\n");
    """ % (attributes, style))

# Follows the color_scatter gallery example

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = [
    "#%02x%02x%02x" % (int(r), int(g), 150) for r, g in zip(50+2*x, 30+2*y)
]

p = figure(tools="pan,wheel_zoom,zoom_in,zoom_out,reset")

p.scatter(x, y, radius=radii,
          fill_color=colors, fill_alpha=0.6,
          line_color=None)

# Add a div to display events and a button to trigger button click events

div = Div(width=1000)
button = Button(label="Button", button_type="success")
layout = column(button, row(p, div))


## Register event callbacks

# Button event
button.js_on_event(events.ButtonClick, display_event(div))

# LOD events
p.js_on_event(events.LODStart, display_event(div))
p.js_on_event(events.LODEnd, display_event(div))

# Point events
point_attributes = ['x','y','sx','sy']
p.js_on_event(events.Tap,       display_event(div, attributes=point_attributes))
p.js_on_event(events.DoubleTap, display_event(div, attributes=point_attributes))
p.js_on_event(events.Press,     display_event(div, attributes=point_attributes))

# Mouse wheel event
p.js_on_event(events.MouseWheel, display_event(div,attributes=point_attributes+['delta']))

# Mouse move, enter and leave
p.js_on_event(events.MouseMove,  display_event(div, attributes=point_attributes))
p.js_on_event(events.MouseEnter, display_event(div, attributes=point_attributes))
p.js_on_event(events.MouseLeave, display_event(div, attributes=point_attributes))

# Pan events
pan_attributes = point_attributes + ['delta_x', 'delta_y']
p.js_on_event(events.Pan,      display_event(div, attributes=pan_attributes))
p.js_on_event(events.PanStart, display_event(div, attributes=point_attributes))
p.js_on_event(events.PanEnd,   display_event(div, attributes=point_attributes))

# Pinch events
pinch_attributes = point_attributes + ['scale']
p.js_on_event(events.Pinch,      display_event(div, attributes=pinch_attributes))
p.js_on_event(events.PinchStart, display_event(div, attributes=point_attributes))
p.js_on_event(events.PinchEnd,   display_event(div, attributes=point_attributes))

output_file("js_events.html", title="JS Events Example")
show(layout)
