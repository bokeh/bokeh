""" Include Bokeh plots in Sphinx HTML documentation.

For other output types, the placeholder text ``[graph]`` will
be generated.

Usage
-----

The ``bokeh-plot`` directive can be used by either supplying:

1. **A path to a source file** as the argument to the directive::

    .. bokeh-plot:: path/to/plot.py


2. **Inline code** as the content of the directive::

    .. bokeh-plot::

        from bokeh.plotting import figure, output_file, show

        output_file("example.html")

        x = [1, 2, 3, 4, 5]
        y = [6, 7, 6, 4, 5]

        p = figure(title="example", plot_width=300, plot_height=300)
        p.line(x, y, line_width=2)
        p.circle(x, y, size=10, fill_color="white")

        show(p)

This directive also works in conjunction with Sphinx autodoc, when
used in docstrings.

Options
-------

The ``bokeh-plot`` directive accepts the following options:

source-position : enum('above', 'below', 'none')
    Where to locate the the block of formatted source
    code (if anywhere).

linenos : bool
    Whether to display line numbers along with the source.

emphasize-lines : list[int]
    A list of source code lines to emphasize.

Examples
--------

The inline example code above produces the following output:

----

.. bokeh-plot::

    from bokeh.plotting import figure, output_file, show

    output_file("example.html")

    x = [1, 2, 3, 4, 5]
    y = [6, 7, 6, 4, 5]

    p = figure(title="example", plot_width=300, plot_height=300)
    p.line(x, y, line_width=2)
    p.circle(x, y, size=10, fill_color="white")

    show(p)

"""
from __future__ import absolute_import

import hashlib
from os import makedirs
from os.path import basename, dirname, exists, isdir, join, relpath
import re
from shutil import copy
import sys
from tempfile import mkdtemp
import webbrowser

from docutils import nodes
from docutils.parsers.rst.directives import choice, flag, unchanged
from docutils.statemachine import ViewList

import jinja2

from sphinx.locale import _
from sphinx.util.compat import Directive

from .utils import out_of_date
from .. import charts, io, plotting
from ..document import Document
from ..embed import autoload_static
from ..resources import CDN
from ..util.string import decode_utf8


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
    optional_arguments = 2

    option_spec = {
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

        if not hasattr(env, 'bokeh_plot_tmpdir'):
            env.bokeh_plot_tmpdir = mkdtemp()
            app.verbose("creating new temp dir for bokeh-plot cache: %s" % env.bokeh_plot_tmpdir)
        else:
            tmpdir = env.bokeh_plot_tmpdir
            if not exists(tmpdir) or not isdir(tmpdir):
                app.verbose("creating new temp dir for bokeh-plot cache: %s" % env.bokeh_plot_tmpdir)
                env.bokeh_plot_tmpdir = mkdtemp()
            else:
                app.verbose("using existing temp dir for bokeh-plot cache: %s" % env.bokeh_plot_tmpdir)

        # TODO (bev) verify that this is always the correct thing
        rst_source = self.state_machine.node.document['source']
        rst_dir = dirname(rst_source)
        rst_filename = basename(rst_source)

        target_id = "%s.bokeh-plot-%d" % (rst_filename, env.new_serialno('bokeh-plot'))
        target_node = nodes.target('', '', ids=[target_id])
        result = [target_node]

        try:
            source = self._get_source()
        except Exception:
            node = nodes.error(None,
                               nodes.paragraph(text="Unable to generate Bokeh plot at %s:%d:" % (basename(rst_source), self.lineno)),
                               nodes.paragraph(text=str(sys.exc_info()[1])))
            return [node]

        source_position = self.options.get('source-position', 'below')

        if source_position == 'above':
            result += self._get_source_nodes(source)

        node = bokeh_plot()
        node['target_id'] = target_id
        node['source'] = source
        node['relpath'] = relpath(rst_dir, env.srcdir)
        node['rst_source'] = rst_source
        node['rst_lineno'] = self.lineno
        if 'alt' in self.options:
            node['alt'] = self.options['alt']
        if self.arguments:
            node['path'] = self.arguments[0]
            env.note_dependency(node['path'])
        if len(self.arguments) == 2:
            node['symbol'] = self.arguments[1]
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

# patch open and show and save to be no-ops
def _noop(*args, **kwargs):
    pass

def _show(obj=None):
    if obj:
        plotting._obj = obj

webbrowser.open = _noop
charts.save = _noop
charts.show = _show
io.save = _noop
io.show = _show
plotting.save = _noop
plotting.show = _show

def _render_plot(source, symbol):
    plotting._default_document = Document()
    namespace = {}
    # need to remove any encoding comment before compiling unicode
    pat = re.compile(r"^# -\*- coding: (.*) -\*-$", re.M)
    source = pat.sub("", source)
    code = compile(source, "<string>", mode="exec")
    eval(code, namespace)
    # TODO (bev) remove this crap
    if symbol is not None:
        if 'bokeh.charts' in source:
            obj = namespace[symbol].chart.plot
        else:
            obj = namespace[symbol]
    else:
        obj = plotting._obj
    return obj

def html_visit_bokeh_plot(self, node):
    env = self.builder.env
    dest_dir = join(self.builder.outdir, node["relpath"])

    try:
        if node.has_key('path'):
            path = node['path']
            filename = "bokeh-plot-%s.js" %  hashlib.md5(path.encode('utf-8')).hexdigest()
            dest_path = join(dest_dir, filename)
            tmpdir = join(env.bokeh_plot_tmpdir, node["relpath"])
            if not exists(tmpdir): makedirs(tmpdir)
            cached_path = join(tmpdir, filename)

            if out_of_date(path, cached_path) or not exists(cached_path+".script"):
                self.builder.app.verbose("generating new plot for '%s'" % path)
                plot = _render_plot(node['source'], node.get('symbol'))
                js, script = autoload_static(plot, CDN, filename)
                with open(cached_path, "w") as f:
                    f.write(js)
                with open(cached_path+".script", "w") as f:
                    f.write(script)
            else:
                self.builder.app.verbose("using cached plot for '%s'" % path)
                script = open(cached_path+".script", "r").read()

            if not exists(dest_dir): makedirs(dest_dir)
            copy(cached_path, dest_path)
        else:
            filename = node['target_id'] + ".js"
            dest_path = join(dest_dir, filename)
            plot = _render_plot(node['source'], None)
            js, script = autoload_static(plot, CDN, filename)
            self.builder.app.verbose("saving inline plot at: %s" % dest_path)
            with open(dest_path, "w") as f:
                f.write(js)

        html = SCRIPT_TEMPLATE.render(script=script)
        self.body.append(html)
    except Exception:
        err_node = nodes.error(None,
                               nodes.paragraph(text="Unable to generate Bokeh plot at %s:%d:" % (node['rst_source'], node['rst_lineno'])),
                               nodes.paragraph(text=str(sys.exc_info()[1])))
        node.children.append(err_node)
        raise nodes.SkipDeparture
    else:
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






