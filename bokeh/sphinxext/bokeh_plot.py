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

import ast
import hashlib
from os.path import basename, dirname, join

from docutils import nodes
from docutils.parsers.rst import Directive, Parser
from docutils.parsers.rst.directives import choice

import jinja2

from sphinx.errors import SphinxError
from sphinx.util import console, copyfile, ensuredir
from sphinx.util.nodes import set_source_info

from ..application.handlers.code_runner import _CodeRunner
from ..application.handlers.handler import Handler
from ..document import Document
from ..embed import autoload_static
from ..io import set_curdoc, curdoc
from ..resources import Resources
from ..settings import settings


PLOT_PAGE_TEMPLATE = jinja2.Template(u"""
:orphan:

.. index::
   single: examples; {{ filename }}

{{ filename }}
{{ '-' * filename|length }}

{% if docstring %}
{{ docstring }}
{% endif %}

.. code-block:: python

    {{ source|indent(4) }}

----

.. raw:: html

    {{ script|indent(4) }}

""")

if settings.docs_cdn() == "local":
    resources = Resources(mode="server", root_url="/en/latest/")
else:
    resources = Resources(mode="cdn")

class ExampleHandler(Handler):
    """ A stripped-down handler similar to CodeHandler but that does
    some appropriate monkeypatching to

    """

    _output_funcs = ['output_server', 'output_notebook', 'output_file', 'reset_output']
    _io_funcs = ['show', 'save', 'push']

    def __init__(self, source, filename):
        super(ExampleHandler, self).__init__(self)
        self._runner = _CodeRunner(source, filename, [])

    def modify_document(self, doc):
        if self.failed:
            return

        module = self._runner.new_module()

        old_doc = curdoc()
        set_curdoc(doc)

        old = self._monkeypatch()

        try:
            self._runner.run(module, lambda: None)
        finally:
            self._unmonkeypatch(old)
            set_curdoc(old_doc)

    def _monkeypatch(self):

        def _pass(*args, **kw): pass
        def _add_root(obj, *args, **kw):
            from bokeh.io import curdoc
            curdoc().add_root(obj)

        # these functions are transitively imported from io into plotting, and
        # charts, so we have to patch them all. Assumption is that no other
        # patching has occurred, i.e. we can just save the funcs being patched
        # once, from io, and use those as the originals to replace everywhere
        import bokeh.io as io
        import bokeh.plotting as p
        import bokeh.charts as c

        old = {}
        for f in self._output_funcs + self._io_funcs:
            old[f] = getattr(io, f)

        for mod in [io, p, c]:
            for f in self._output_funcs:
                setattr(mod, f, _pass)
            for f in self._io_funcs:
                setattr(mod, f, _add_root)

        return old

    def _unmonkeypatch(self, old):
        import bokeh.io as io
        import bokeh.plotting as p
        import bokeh.charts as c
        for mod in [io, p, c]:
            for f in old:
                setattr(mod, f, old[f])

    @property
    def failed(self):
        return self._runner.failed

    @property
    def error(self):
        return self._runner.error

    @property
    def error_detail(self):
        return self._runner.error_detail


class PlotScriptError(SphinxError):
    """ Error during script parsing. """

    category = 'PlotScript error'


def _process_script(source, filename, auxdir, js_name):
    c = ExampleHandler(source=source, filename=filename)
    d = Document()
    c.modify_document(d)
    if c.error:
        raise PlotScriptError(c.error_detail)

    script_path = join("/scripts", js_name)
    js_path = join(auxdir, js_name)
    js, script = autoload_static(d.roots[0], resources, script_path)

    with open(js_path, "w") as f:
        f.write(js)

    return (script, js, js_path, source)

class PlotScriptParser(Parser):
    """ This Parser recognizes .py files in the Sphinx source tree,
    assuming that they contain bokeh examples

    Note: it is important that the .py files are parsed first. This is
    accomplished by reordering the doc names in the env_before_read_docs callback

    """

    def get_transforms(self):
        """ List of transforms for documents parsed by this parser.

        """
        return super(PlotScriptParser, self).get_transforms() + []

    def parse(self, source, document):
        """ Parse ``source``, write results to ``document``.

        """
        env = document.settings.env
        filename = env.doc2path(env.docname) # e.g. full path to docs/user_guide/examples/layout_vertical

        # This code splits the source into two parts: the docstring (or None if
        # there is not one), and the remaining source code after
        m = ast.parse(source)
        docstring = ast.get_docstring(m)
        if docstring is not None:
            lines = source.split("\n")
            lineno = m.body[0].lineno # assumes docstring is m.body[0]
            source = "\n".join(lines[lineno:])

        js_name = "bokeh-plot-%s.js" % hashlib.md5(env.docname.encode('utf-8')).hexdigest()

        (script, js, js_path, source) = _process_script(source, filename, env.bokeh_plot_auxdir, js_name)

        env.bokeh_plot_files[env.docname] = (script, js, js_path, source)

        rst = PLOT_PAGE_TEMPLATE.render(source=source,
                                        filename=basename(filename),
                                        docstring=docstring,
                                        script=script)

        document['bokeh_plot_include_bokehjs'] = True

        super(PlotScriptParser, self).parse(rst, document)

class BokehPlotDirective(Directive):

    has_content = True
    optional_arguments = 2

    option_spec = {
        'source-position': lambda x: choice(x, ('below', 'above', 'none')),
    }

    def run(self):

        env = self.state.document.settings.env

        # filename *or* python code content, but not both
        if self.arguments and self.content:
            raise SphinxError("bokeh-plot:: directive can't have both args and content")

        # process inline examples here
        if self.content:
            source = '\n'.join(self.content)
            # need docname not to look like a path
            docname = env.docname.replace("/", "-")
            serialno = env.new_serialno(env.docname)
            js_name = "bokeh-plot-%s-inline-%d.js" % (docname, serialno)
            # the code runner just needs a real path to cd to, this will do
            path = join(env.bokeh_plot_auxdir, js_name)

            (script, js, js_path, source) = _process_script(source, path, env.bokeh_plot_auxdir, js_name)
            env.bokeh_plot_files[js_name] = (script, js, js_path, source)

        # process example files here
        else:
            example_path = self.arguments[0][:-3]  # remove the ".py"

            # if it's an "internal" example, the python parser has already handled it
            if example_path in env.bokeh_plot_files:
                (script, js, js_path, source) = env.bokeh_plot_files[example_path]

            # handle examples external to the docs source, e.g. gallery examples
            else:
                source = open(self.arguments[0]).read()
                docname = env.docname.replace("/", "-")
                serialno = env.new_serialno(env.docname)
                js_name = "bokeh-plot-%s-external-%d.js" % (docname, serialno)
                (script, js, js_path, source) = _process_script(source, self.arguments[0], env.bokeh_plot_auxdir, js_name)
                env.bokeh_plot_files[js_name] = (script, js, js_path, source)

        # use the source file name to construct a friendly target_id
        target_id = "%s.%s" % (env.docname, basename(js_path))
        target = nodes.target('', '', ids=[target_id])
        result = [target]

        code = nodes.literal_block(source, source, language="python", linenos=False, classes=[])
        set_source_info(self, code)

        source_position = self.options.get('source-position', 'below')

        if source_position == "above": result += [code]

        result += [nodes.raw('', script, format="html")]

        if source_position == "below": result += [code]

        self.state.document['bokeh_plot_include_bokehjs'] = True

        return result

def env_before_read_docs(app, env, docnames):
    docnames.sort(key=lambda x: 2 if "extension" in x else 0 if "examples" in x else 1)

def builder_inited(app):
    app.env.bokeh_plot_auxdir = join(app.env.doctreedir, 'bokeh_plot')
    ensuredir(app.env.bokeh_plot_auxdir) # sphinx/_build/doctrees/bokeh_plot

    if not hasattr(app.env, 'bokeh_plot_files'):
        app.env.bokeh_plot_files = {}

def html_page_context(app, pagename, templatename, context, doctree):
    """ Add BokehJS to pages that contain plots.

    """
    if doctree and doctree.get('bokeh_plot_include_bokehjs'):
        context['bokeh_css_files'] = resources.css_files
        context['bokeh_js_files'] = resources.js_files

def build_finished(app, exception):
    files = set()
    for (script, js, js_path, source) in app.env.bokeh_plot_files.values():
        files.add(js_path)
    for file in app.status_iterator(files, 'copying linked files... ',
                                    console.brown, len(files)):
        target = join(app.builder.outdir, "scripts", basename(file))
        ensuredir(dirname(target))
        try:
            copyfile(file, target)
        except OSError as err:
            raise SphinxError('cannot copy local file {!r}: {}'.format(file, err))

def env_purge_doc(app, env, docname):
    """ Remove local files for a given document.

    """
    if docname in env.bokeh_plot_files:
        del env.bokeh_plot_files[docname]

def setup(app):
    app.add_source_parser('.py', PlotScriptParser)

    app.add_directive('bokeh-plot', BokehPlotDirective)

    app.connect('env-before-read-docs', env_before_read_docs)
    app.connect('builder-inited',       builder_inited)
    app.connect('html-page-context',    html_page_context)
    app.connect('build-finished',       build_finished)
    app.connect('env-purge-doc',        env_purge_doc)
