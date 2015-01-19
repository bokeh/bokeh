"""

"""
from __future__ import absolute_import

from os import makedirs
from os.path import dirname, exists, isdir, join, relpath
import re
from shutil import copy
from tempfile import mkdtemp

from docutils import nodes
from docutils.parsers.rst.directives import choice, flag, path, unchanged
from docutils.statemachine import ViewList

import jinja2

from sphinx.locale import _
from sphinx.util.compat import Directive
from sphinx.util.nodes import nested_parse_with_titles


from .utils import out_of_date
from ..utils import decode_utf8

SOURCE_TEMPLATE = jinja2.Template(u"""
.. code-block:: python
   {% if linenos %}:linenos:{% endif %}
   {% if emphasize_lines %}:emphasize-lines: {{ emphasize_lines }}{% endif %}

   {{ source|indent(3) }}

""")


SCRIPT_TEMPLATE = jinja2.Template(u"""
<table>
  <tr>
    <td>
    {{ script|indent(4) }}
    </td>
  </tr>
</table>
""")


class bokeh_plot(nodes.General, nodes.Element):
    pass


def _source_position(argument):
    return choice(argument, ('below', 'above', 'none'))


class BokehPlotDirective(Directive):

    has_content = True
    optional_arguments = 1

    option_spec = {
        'basedir'         : path,
        'source-position' : _source_position,
        'linenos'         : flag,
        'emphasize-lines' : unchanged,
    }

    def run(self):

        # filename *or* python code content, but not both
        if self.arguments and self.content:
            raise RuntimeError("bokeh-plot:: directive can't have both args and content")

        env = self.state.document.settings.env
        app = env.app
        config = app.config

        if not hasattr(env, 'bokeh_plot_tmpdir'):
            env.bokeh_plot_tmpdir = mkdtemp()
            app.debug("creating new temp dir for bokeh-plot cache: %s" % env.bokeh_plot_tmpdir)
        else:
            tmpdir = env.bokeh_plot_tmpdir
            if not exists(tmpdir) or not isdir(tmpdir):
                app.debug("creating new temp dir for bokeh-plot cache: %s" % env.bokeh_plot_tmpdir)
                env.bokeh_plot_tmpdir = mkdtemp()
            else:
                app.debug("using existing temp dir for bokeh-plot cache: %s" % env.bokeh_plot_tmpdir)

        target_id = "bokeh-plot-%d" % env.new_serialno('bokeh-plot')
        target_node = nodes.target('', '', ids=[target_id])
        result = [target_node]

        source = self._get_source()

        source_position = self.options.get('source-position', 'below')

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
            env.note_dependency(node['path'])
        result += [node]

        if source_position == 'below':
            result += self._get_source_nodes(source)

        return result

    def _get_source(self):
        if self.arguments:
            source = open(self.arguments[0], "r").read()
            source = decode_utf8(source)
        else:
            source = u""
            for line in self.content:
                source += "%s\n" % line
        return source

    def _get_source_nodes(self, source):
        linenos = 'linenos' in self.options
        emphasize_lines = self.options.get('emphasize-lines', False)
        if emphasize_lines: linenos = True
        result = ViewList()
        text = SOURCE_TEMPLATE.render(source=source, linenos=linenos, emphasize_lines=emphasize_lines)
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
    # need to remove any encoding comment before compiling unicode
    pat = re.compile(r"^# -\*- coding: (.*) -\*-$", re.M)
    source = pat.sub("", source)
    code = compile(source, "<string>", mode="exec")
    eval(code, namespace)
    return plotting._obj

def html_visit_bokeh_plot(self, node):
    env = self.builder.env
    dest_dir = join(self.builder.outdir, node["relpath"])

    if node.has_key('path'):
        path = node['path']
        filename = "bokeh-plot-%d.js" % hash(path)
        dest_path = join(dest_dir, filename)
        tmpdir = join(env.bokeh_plot_tmpdir, node["relpath"])
        if not exists(tmpdir): makedirs(tmpdir)
        cached_path = join(tmpdir, filename)

        if out_of_date(path, cached_path) or not exists(cached_path+".script"):
            self.builder.info("generating new plot for '%s'" % path)
            plot = _render_plot(node['source'])
            js, script = autoload_static(plot, CDN, filename)
            with open(cached_path, "w") as f:
                f.write(js)
            with open(cached_path+".script", "w") as f:
                f.write(script)
        else:
            self.builder.info("using cached plot for '%s'" % path)
            script = open(cached_path+".script", "r").read()

        if not exists(dest_dir): makedirs(dest_dir)
        copy(cached_path, dest_path)
    else:
        filename = node['target_id'] + ".js"
        dest_path = join(dest_dir, filename)
        plot = _render_plot(node['source'])
        js, script = autoload_static(plot, CDN, filename)
        with open(dest_path, "w") as f:
            f.write(js)

    html = SCRIPT_TEMPLATE.render(script=script)
    self.body.append(html)
    raise nodes.SkipNode


def latex_visit_bokeh_plot(self, node):
    if 'alt' in node.attributes:
        self.body.append(_('[graph: %s]') % node['alt'])
    else:
        self.body.append(_('[graph]'))
    raise nodes.SkipNode


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






