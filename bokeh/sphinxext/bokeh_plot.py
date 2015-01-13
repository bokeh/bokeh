"""

"""
from __future__ import absolute_import

from docutils import nodes
from docutils.parsers.rst.directives import choice, unchanged
from docutils.statemachine import ViewList

import jinja2
from sphinx.util.compat import Directive
from sphinx.util.nodes import nested_parse_with_titles

from .utils import out_of_date

SOURCE_TEMPLATE = jinja2.Template("""
.. code-block:: python
    :linenos:

    {{ source|indent(4)}}
""")

PLOT_TEMPLATE = jinja2.Template("""
.. raw:: html

    <table>
      <tr>
        <td>
        {{ plot|indent(8) }}
        </td>
      </tr>
    </table>
""")


def _source_position(argument):
    return choice(argument, ('below', 'above', 'none'))


class BokehPlotDirective(Directive):

    has_content = True
    optional_arguments = 1

    option_spec = {
        'basedir'         : unchanged,
        'source-position' : _source_position,
    }

    def run(self):

        # filename *or* python code content, but not both
        if self.arguments and self.content:
            raise RuntimeError("bokeh-plot:: directive can't have both args and content")

        self.result = ViewList()

        env = self.state.document.settings.env

        target_id = "bokeh-plot-%d" % env.new_serialno('bokeh-plot')
        target_node = nodes.target('', '', ids=[target_id])

        source_position = self.options.get('source-position', 'below')

        source = self._get_source()

        if source_position is 'above':
            self._add_source(source)

        self._add_plot(source)

        if source_position is 'below':
            self._add_source(source)

        node = nodes.paragraph()
        node.document = self.state.document
        self.state.nested_parse(self.result, 0, node)

        return [target_node] + node.children

    def _get_source(self):
        if self.arguments:
            self.source = open(self.arguments[0], "r").read()
        else:
            source = ""
            for line in self.content:
                source += "%s\n" % line
        return source

    def _add_source(self, source):
        text = SOURCE_TEMPLATE.render(source=source)
        for line in text.split("\n"):
            self.result.append(line, "<bokeh-plot>")


    def _add_plot(self, source):
        # TODO: (bev) run source code and create plot embed snippet
        text = PLOT_TEMPLATE.render(plot="FOO")
        for line in text.split("\n"):
            self.result.append(line, "<bokeh-plot>")


def setup(app):
    app.add_directive('bokeh-plot', BokehPlotDirective)






