#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Generate visual representations of palettes in Bokeh palette groups.

The ``bokeh.palettes`` modules expose attributes such as ``mpl``, ``brewer``,
and ``d3`` that provide groups of palettes. The ``bokeh-palette-group``
directive accepts the name of one of these groups, and generates a visual
matrix of colors for every palette in the group.

As an example, the following usage of the the directive:

.. code-block:: rest

    .. bokeh-palette-group:: mpl

Generates the output:

    .. bokeh-palette-group:: mpl

.. note::
   This extension assumes both Bootstrap and JQuery are present (which is the
   case for the Bokeh documentation theme). If using this theme outside the
   Bokeh documentation, be sure to include those resources by hand.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from docutils import nodes
from docutils.parsers.rst import Directive
from sphinx.errors import SphinxError

# Bokeh imports
import bokeh.palettes as bp

# Bokeh imports
from .templates import PALETTE_GROUP_DETAIL

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bokeh_palette_group',
    'BokehPaletteGroupDirective',
    'html_visit_bokeh_palette_group',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class bokeh_palette_group(nodes.General, nodes.Element):
    pass


class BokehPaletteGroupDirective(Directive):

    has_content = False
    required_arguments = 1

    def run(self):
        node = bokeh_palette_group()
        node['group'] = self.arguments[0]
        return [node]


# NOTE: This extension now *assumes* both Bootstrap and JQuery are present
# (which is now the case for the Bokeh docs theme).
def html_visit_bokeh_palette_group(self, node):
    self.body.append('<div class="container-fluid"><div class="row">')
    group = getattr(bp, node['group'], None)
    if not isinstance(group, dict):
        raise SphinxError("invalid palette group name %r" % node['group'])
    names = sorted(group)
    for name in names:
        palettes = group[name]
        # arbitrary cutoff here, idea is to not show large (e.g 256 length) palettes
        numbers = [x for x in sorted(palettes) if x < 30]
        html = PALETTE_GROUP_DETAIL.render(name=name, numbers=numbers, palettes=palettes)
        self.body.append(html)
    self.body.append('</div></div>')
    raise nodes.SkipNode

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_node(bokeh_palette_group, html=(html_visit_bokeh_palette_group, None))
    app.add_directive('bokeh-palette-group', BokehPaletteGroupDirective)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
