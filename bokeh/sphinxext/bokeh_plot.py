""" Include Bokeh plots in Sphinx HTML documentation.

For other output types, the placeholder text ``[graph]`` will
be generated.

The ``bokeh-plot`` directive can be used by either supplying:

**A path to a source file** as the argument to the directive::

    .. bokeh-plot:: path/to/plot.py


**Inline code** as the content of the directive::

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

import sys
import types
import hashlib
from os import makedirs
from os.path import basename, dirname, exists, isdir, join, relpath
import re
from shutil import copy
from tempfile import mkdtemp
import webbrowser

from docutils import nodes
from docutils.parsers.rst.directives import choice, flag, unchanged
from docutils.statemachine import ViewList

import jinja2

from sphinx.locale import _
from sphinx.util.compat import Directive
from sphinx.errors import SphinxError

from .utils import out_of_date
from .. import io
from ..document import Document
from ..embed import autoload_static
from ..resources import Resources
from ..settings import settings
from ..util.string import decode_utf8


SOURCE_TEMPLATE = jinja2.Template(u"""
.. code-block:: python
   {% if linenos %}:linenos:{% endif %}
   {% if emphasize_lines %}:emphasize-lines: {{ emphasize_lines }}{% endif %}

   {{ source|indent(3) }}

""")


class bokeh_plot(nodes.General, nodes.Element):
    pass


def _source_position(argument):
    return choice(argument, ('below', 'above', 'none'))


class BokehPlotDirective(Directive):

    has_content = True
    optional_arguments = 2

    option_spec = {
        'source-position': _source_position,
        'linenos': flag,
        'emphasize-lines': unchanged,
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

        # get the name of the source file we are currently processing
        rst_source = self.state_machine.document['source']
        rst_dir = dirname(rst_source)
        rst_filename = basename(rst_source)

        # use the source file name to construct a friendly target_id
        target_id = "%s.bokeh-plot-%d" % (rst_filename, env.new_serialno('bokeh-plot'))
        target_node = nodes.target('', '', ids=[target_id])
        result = [target_node]

        try:
            source = self._get_source()
        except Exception as e:
            raise SphinxError("Unable to read source for Bokeh plot at %s:%d:%s" % (basename(rst_source), self.lineno, e))

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
def _open(*args, **kwargs):
    pass


def _save(*args, **kwargs):
    pass


def _show(obj=None):
    if obj:
        io._obj = obj

# This is so Bokeh can correctly document itself
_save.__doc__ = io.save.__doc__
_save.__module__ = io.save.__module__
_show.__doc__ = io.show.__doc__
_show.__module__ = io.show.__module__

webbrowser.open = _open
io.save = _save
io.show = _show


def _render_plot(source, path=None, symbol=None):
    io._state._document = Document()
    namespace = {}
    if path is not None:
        sys.modules["fake"] = types.ModuleType("fake")
        sys.modules["fake"].__file__ = path
        namespace["__name__"] = "fake"
    # need to remove any encoding comment before compiling unicode
    pat = re.compile(r"^# -\*- coding: (.*) -\*-$", re.M)
    source = pat.sub("", source)
    code = compile(source, path or "<string>", mode="exec")
    eval(code, namespace)
    # TODO (bev) remove this crap
    if symbol is not None:
        obj = namespace[symbol]
    else:
        obj = io._obj
    return obj


def html_visit_bokeh_plot(self, node):
    env = self.builder.env
    dest_dir = join(self.builder.outdir, node["relpath"])

    if settings.docs_cdn() == "local":
        resources = Resources(mode="server", root_url="/en/latest/")
    else:
        resources = Resources(mode="cdn")

    try:
        if "path" in node:
            path = node['path']
            filename = "bokeh-plot-%s.js" % hashlib.md5(path.encode('utf-8')).hexdigest()
            dest_path = join(dest_dir, filename)
            tmpdir = join(env.bokeh_plot_tmpdir, node["relpath"])
            if not exists(tmpdir): makedirs(tmpdir)
            cached_path = join(tmpdir, filename)

            if out_of_date(path, cached_path) or not exists(cached_path+".script"):
                self.builder.app.verbose("generating new plot for '%s'" % path)
                plot = _render_plot(node['source'], path, node.get('symbol'))
                js, script = autoload_static(plot, resources, filename)
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
            if not exists(dest_dir): makedirs(dest_dir)
            dest_path = join(dest_dir, filename)
            plot = _render_plot(node['source'])
            js, script = autoload_static(plot, resources, filename)
            self.builder.app.verbose("saving inline plot at: %s" % dest_path)
            with open(dest_path, "w") as f:
                f.write(js)

        self.body.append(script)
    except Exception as e:
        raise SphinxError("Unable to generate Bokeh plot at %s:%d:%s" % (node['rst_source'], node['rst_lineno'], e))
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
