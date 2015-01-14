"""

"""
from __future__ import absolute_import

from os.path import dirname, join, relpath

from docutils import nodes
from docutils.parsers.rst.directives import choice, unchanged
from docutils.statemachine import ViewList

import jinja2

from sphinx.locale import _
from sphinx.util.compat import Directive
from sphinx.util.nodes import nested_parse_with_titles

from .utils import out_of_date

SOURCE_TEMPLATE = jinja2.Template("""
.. code-block:: python
    {% if linenos %}
    :linenos:
    {% endif %}

    {{ source|indent(4)}}
""")


SCRIPT_TEMPLATE = jinja2.Template("""
<table>
  <tr>
    <td>
    {{ script|indent(4) }}
    </td>
  </tr>
</table>
""")


def _source_position(argument):
    return choice(argument, ('below', 'above', 'none'))


class bokeh_plot(nodes.General, nodes.Element):
    pass


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

        env = self.state.document.settings.env
        app = env.app

        target_id = "bokeh-plot-%d" % env.new_serialno('bokeh-plot')
        target_node = nodes.target('', '', ids=[target_id])

        source_position = self.options.get('source-position', 'below')

        source = self._get_source()

        result = [target_node]

        if source_position == 'above':
            result += self._get_source_nodes(source)

        node = bokeh_plot()
        node['target_id'] = target_id
        node['source'] = source
        node['relpath'] = dirname(relpath(self.state_machine.node.source, env.srcdir))
        if 'alt' in self.options:
            node['alt'] = self.options['alt']
        if self.arguments:
            node['path'] = self.arguments[0]
        result += [node]

        if source_position == 'below':
            result += self._get_source_nodes(source)

        return result

    def _get_source(self):
        if self.arguments:
            source = open(self.arguments[0], "r").read()
        else:
            source = ""
            for line in self.content:
                source += "%s\n" % line
        return source

    def _get_source_nodes(self, source):
        linenos = self.options.get('linenos', False)
        result = ViewList()
        text = SOURCE_TEMPLATE.render(source=source, linenos=linenos)
        for line in text.split("\n"):
            result.append(line, "<bokeh-plot>")
        node = nodes.paragraph()
        node.document = self.state.document
        self.state.nested_parse(result, 0, node)
        return node.children

from bokeh import plotting
from bokeh.document import Document
from bokeh.embed import autoload_static
from bokeh.resources import CDN
import webbrowser

# patch open and show and save to be no-ops
def _noop(*args, **kwargs):
    pass

def _show(obj=None):
    if obj:
        plotting._obj = obj

webbrowser.open = _noop
plotting.save = _noop
plotting.show = _show

def _render_plot(source):
    plotting._default_document = Document()
    namespace = {}
    code = compile(source, "<string>", mode="exec")
    eval(code, namespace)
    return plotting._obj

def html_visit_bokeh_plot(self, node):
    if node.has_key('path'):
        pass
    else:
        path = join(self.builder.outdir, node["relpath"])
        filename = node['target_id'] + ".js"
        plot = _render_plot(node['source'])
        js, script = autoload_static(
            plot, CDN, join(node["relpath"], filename)
        )
        with open(join(path, filename), "w") as f:
            f.write(js)

    html = SCRIPT_TEMPLATE.render(script=script)
    self.body.append(html)
    raise nodes.SkipNode


def latex_visit_bokeh_plot(self, node):
    if 'alt' in node.attributes:
        self.body.append(_('[graph: %s]') % node['alt'])
    else:
        self.body.append(_('[graph]'))
    raise nodes.SkipNodepass


def texinfo_visit_bokeh_plot(self, node):
    if 'alt' in node.attributes:
        self.body.append(_('[graph: %s]') % node['alt'])
    else:
        self.body.append(_('[graph]'))
    raise nodes.SkipNode


def text_visit_bokeh_plot(self, node):
    if 'alt' in node.attributes:
        self.add_text(_('[graph: %s]') % node['alt'])
    else:
        self.add_text(_('[graph]'))
    raise nodes.SkipNode


def man_visit_bokeh_plot(self, node):
    if 'alt' in node.attributes:
        self.body.append(_('[graph: %s]') % node['alt'])
    else:
        self.body.append(_('[graph]'))
    raise nodes.SkipNode


def setup(app):
    app.add_node(bokeh_plot,
                 html=(html_visit_bokeh_plot, None),
                 latex=(latex_visit_bokeh_plot, None),
                 texinfo=(texinfo_visit_bokeh_plot, None),
                 text=(text_visit_bokeh_plot, None),
                 man=(man_visit_bokeh_plot, None))
    app.add_directive('bokeh-plot', BokehPlotDirective)






