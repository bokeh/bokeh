""" Document Bokeh color objects.

The ``bokeh-color`` directive generates a color swatch for named colors
in the ``bokeh.colors`` module:

    .. bokeh-color:: aliceblue

"""
from __future__ import absolute_import, print_function

from docutils import nodes

from bokeh.colors import named

from .bokeh_directive import BokehDirective
from .templates import COLOR_DETAIL

class BokehColorDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    optional_arguments = 2

    def run(self):

        color = self.arguments[0]

        html = COLOR_DETAIL.render(color=getattr(named, color).to_css(), text=color)
        node = nodes.raw('', html, format="html")
        return [node]

def setup(app):
    app.add_directive_to_domain('py', 'bokeh-color', BokehColorDirective)
