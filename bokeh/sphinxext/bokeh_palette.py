""" Generate color representations of all known Bokeh palettes.

This directive takes no arguments.

"""
from __future__ import absolute_import

from docutils import nodes

from sphinx.util.compat import Directive

from ..palettes import small_palettes
from .templates import PALETTE_DETAIL

CSS = """
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
"""

JS = """
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
"""


class bokeh_palette(nodes.General, nodes.Element):
    pass


class BokehPaletteDirective(Directive):

    has_content = False
    required_arguments = 1

    def run(self):
        node = bokeh_palette()
        node['module'] = self.arguments[0]
        return [node]

def html_visit_bokeh_palette(self, node):
    names = sorted(small_palettes)
    self.body.append(CSS)
    self.body.append('<div class="container-fluid"><div class="row">"')
    for name in names:
        palette = small_palettes[name]
        numbers = sorted(palette)

        html = PALETTE_DETAIL.render(name=name, numbers=numbers, palette=palette)
        self.body.append(html)
    self.body.append('</div></div>')
    self.body.append(JS)
    raise nodes.SkipNode

def setup(app):
    app.add_node(bokeh_palette, html=(html_visit_bokeh_palette, None))
    app.add_directive('bokeh-palette', BokehPaletteDirective)
