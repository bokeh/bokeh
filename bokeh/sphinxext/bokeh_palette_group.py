""" Generate visual representations of palettes in Bokeh palette groups.

The ``bokeh.palettes`` modules expose attributes such as ``mpl``, ``brewer``,
and ``d3`` that provide groups of palettes. The ``bokeh-palette-group``
directive accepts the name of one of these groups, and generates a visual
matrix of colors for every palette in the group.

As an example, the following usage of the the directive:

.. code-block:: rest

    .. bokeh-palette-group:: mpl

Generates the output:

    .. bokeh-palette-group:: mpl

"""
from __future__ import absolute_import

from docutils import nodes

from sphinx.errors import SphinxError
from sphinx.util.compat import Directive

from .. import palettes as bp
from .templates import PALETTE_GROUP_DETAIL

CSS = """
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
"""

JS = """
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
"""


class bokeh_palette_group(nodes.General, nodes.Element):
    pass


class BokehPaletteGroupDirective(Directive):

    has_content = False
    required_arguments = 1

    def run(self):
        node = bokeh_palette_group()
        node['group'] = self.arguments[0]
        return [node]

def html_visit_bokeh_palette_group(self, node):
    self.body.append(CSS)
    self.body.append('<div class="container-fluid"><div class="row">"')
    group = getattr(bp, node['group'], None)
    if not isinstance(group, dict):
        raise SphinxError("invalid palette group name %r" % node['group'])
    names = sorted(group)
    for name in names:
        palettes = group[name]
        # arbitrary cuttoff here, idea is to not show large (e.g 256 length) palettes
        numbers = [x for x in sorted(palettes) if x < 30]
        html = PALETTE_GROUP_DETAIL.render(name=name, numbers=numbers, palettes=palettes)
        self.body.append(html)
    self.body.append('</div></div>')
    self.body.append(JS)
    raise nodes.SkipNode

def setup(app):
    app.add_node(bokeh_palette_group, html=(html_visit_bokeh_palette_group, None))
    app.add_directive('bokeh-palette-group', BokehPaletteGroupDirective)
