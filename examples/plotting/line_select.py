""" Example demonstrating line selection together with customJS.
It involves clicking on any of the plotted lines to select/ deselect the line.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line, bokeh.models.CustomJS, bokeh.models.TapTool
    :refs: :ref:`ug_basic_lines_multi`,:ref:`ug_interaction_js_callbacks`
    :keywords: line, taptool, customjs

"""
import numpy as np

from bokeh.models import ColumnDataSource, CustomJS, TapTool
from bokeh.plotting import figure, show

t = np.linspace(0, 0.1, 100)

source = ColumnDataSource(data=dict(text=['No line selected'], text_color=['black']))

p = figure(width=600, height=500)

l1 = p.line(t, 100*np.sin(t*50), color='goldenrod', line_width=30)
l2 = p.line(t, 100*np.sin(t*50+1), color='lightcoral', line_width=20)
l3 = p.line(t, 100*np.sin(t*50+2), color='royalblue', line_width=10)

p.text(0, -100, text_color='text_color', source=source)

# cb_data = {geometries: ..., source: ...}
p.add_tools(TapTool(callback=CustomJS(args=dict(source=source), code= """
    // get_view is experimental and may change in the future
    const view = cb_data.source.selected.get_view()
    if (view) {
        const color = view.model.line_color.value
        source.data = {
            text: ['Selected the ' + color + ' line'],
            text_color: [color]
        }
    }
""")))

show(p)
