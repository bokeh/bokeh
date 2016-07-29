""" Generate color representations of all known Bokeh palettes.

This directive takes no arguments.

"""
from __future__ import absolute_import

from docutils import nodes

import jinja2

from sphinx.locale import _
from sphinx.util.compat import Directive

from bokeh.palettes import small_palettes

PALETTE_TEMPLATE = jinja2.Template(u"""
<div class="col-md-4" style="min-height: 230px;">
    <table>
      <tr>
        <th colspan="2"> {{ name }} </th>
      </tr>

      {% for number in numbers %}
      <tr>

        <td height='20px' width='30px'> {{ number }} </td>

        {% for color in palette[number] %}
        <td height="20px" width="20px" style="background-color: {{ color }};"/>
        {% endfor %}

      </tr>
      {% endfor %}
    </table>
</div>
""")

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
    # NOTE: currently only handles the existing Brewer palettes
    names = sorted(small_palettes)
    self.body.append(CSS)
    self.body.append('<div class="container-fluid"><div class="row">"')
    for name in names:
        palette = small_palettes[name]
        numbers = sorted(palette)

        html = PALETTE_TEMPLATE.render(name=name, numbers=numbers, palette=palette)
        self.body.append(html)
    self.body.append('</div></div>')
    self.body.append(JS)
    raise nodes.SkipNode

def latex_visit_bokeh_palette(self, node):
    self.body.append(_('[palette: %s]' % node['module']))
    raise nodes.SkipNode


def texinfo_visit_bokeh_palette(self, node):
    self.body.append(_('[palette: %s]' % node['module']))
    raise nodes.SkipNode


def text_visit_bokeh_palette(self, node):
    self.body.append(_('[palette: %s]' % node['module']))
    raise nodes.SkipNode


def man_visit_bokeh_palette(self, node):
    self.body.append(_('[palette: %s]' % node['module']))
    raise nodes.SkipNode


def setup(app):
    app.add_node(bokeh_palette,
                 html=(html_visit_bokeh_palette, None),
                 latex=(latex_visit_bokeh_palette, None),
                 texinfo=(texinfo_visit_bokeh_palette, None),
                 text=(text_visit_bokeh_palette, None),
                 man=(man_visit_bokeh_palette, None))
    app.add_directive('bokeh-palette', BokehPaletteDirective)
