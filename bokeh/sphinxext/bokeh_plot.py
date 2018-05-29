""" Include Bokeh plots in Sphinx HTML documentation.

For other output types, the placeholder text ``[graph]`` will
be generated.

The ``bokeh-plot`` directive can be used by either supplying:

**A path to a source file** as the argument to the directive::

    .. bokeh-plot:: path/to/plot.py

.. note::
    .py scripts are not scanned automatically! In order to include
    certain directories into .py scanning process use following directive
    in sphinx conf.py file: bokeh_plot_pyfile_include_dirs = ["dir1","dir2"]

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

linenos : flag
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
from os import getenv
from os.path import basename, dirname, join
import re
from uuid import uuid4

from docutils import nodes
from docutils.parsers.rst import Directive, Parser
from docutils.parsers.rst.directives import choice, flag

from sphinx.errors import SphinxError
from sphinx.util import copyfile, ensuredir, status_iterator
from sphinx.util.nodes import set_source_info

from ..document import Document
from ..embed import autoload_static
from ..model import Model
from ..resources import Resources
from ..settings import settings
from ..util.string import decode_utf8
from .example_handler import ExampleHandler
from .templates import PLOT_PAGE

docs_cdn = settings.docs_cdn()

# if BOKEH_DOCS_CDN is unset just use default CDN resources
if docs_cdn is None:
    resources = Resources(mode="cdn")

else:
    # "BOKEH_DOCS_CDN=local" is used for building and displaying the docs locally
    if docs_cdn == "local":
        resources = Resources(mode="server", root_url="/en/latest/")

    # "BOKEH_DOCS_CDN=test:newthing" is used for building and deploying test docs to
    # a one-off location "en/newthing" on the docs site
    elif docs_cdn.startswith("test:"):
        resources = Resources(mode="server", root_url="/en/%s/" % docs_cdn.split(":")[1])

    # Otherwise assume it is a dev/rc/full release version and use CDN for it
    else:
        resources = Resources(mode="cdn", version=docs_cdn)

CODING = re.compile(r"^# -\*- coding: (.*) -\*-$", re.M)

class PlotScriptError(SphinxError):
    """ Error during script parsing. """

    category = 'PlotScript error'

def _process_script(source, filename, env, js_name, use_relative_paths=False):
    # This is lame, but seems to be required for python 2
    source = CODING.sub("", source)

    # Explicitly make sure old extensions are not included until a better
    # automatic mechanism is available
    Model._clear_extensions()

    # quick and dirty way to inject Google API key
    if "GOOGLE_API_KEY" in source:
        GOOGLE_API_KEY = getenv('GOOGLE_API_KEY')
        if GOOGLE_API_KEY is None:
            if env.config.bokeh_missing_google_api_key_ok:
                GOOGLE_API_KEY = "MISSING_API_KEY"
            else:
                raise SphinxError("The GOOGLE_API_KEY environment variable is not set. Set GOOGLE_API_KEY to a valid API key, "
                                  "or set bokeh_missing_google_api_key_ok=True in conf.py to build anyway (with broken GMaps)")
        run_source = source.replace("GOOGLE_API_KEY", GOOGLE_API_KEY)
    else:
        run_source = source

    c = ExampleHandler(source=run_source, filename=filename)
    d = Document()
    c.modify_document(d)
    if c.error:
        raise PlotScriptError(c.error_detail)

    script_path = None
    if(use_relative_paths):
        script_path = join("$REL_PATH$", js_name)
    else:
        script_path = join("/scripts", js_name)

    js_path = join(env.bokeh_plot_auxdir, js_name)
    js, script = autoload_static(d.roots[0], resources, script_path)

    with open(js_path, "w") as f:
        f.write(js)

    return (script, js, js_path, source)

def _get_file_depth_string(docname):
    """Get relative path string of file containing directive"""
    pre_path = ''

    depth = docname.count('/')
    if depth is None:
        pre_path = ''
    else:
        pre_path = ''.join(['../'] * depth)
    return pre_path

class PlotScriptParser(Parser):
    """ This Parser recognizes .py files in the Sphinx source tree,
    assuming that they contain bokeh examples

    Note: it is important that the .py files are parsed first. This is
    accomplished by reordering the doc names in the env_before_read_docs callback

    """

    supported = ('python',)

    def parse(self, source, document):
        """ Parse ``source``, write results to ``document``.

        """
        # This is lame, but seems to be required for python 2
        source = CODING.sub("", source)

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

        js_name = "bokeh-plot-%s.js" % uuid4().hex

        (script, js, js_path, source) = _process_script(source, filename, env, js_name, env.config.bokeh_plot_use_relative_paths)

        env.bokeh_plot_files[env.docname] = (script, js, js_path, source)

        rst = PLOT_PAGE.render(source=source,
                               filename=basename(filename),
                               docstring=docstring,
                               script=script)

        document['bokeh_plot_include_bokehjs'] = True

        # can't use super, Sphinx Parser classes don't inherit object
        Parser.parse(self, rst, document)

class BokehPlotDirective(Directive):

    has_content = True
    optional_arguments = 2

    option_spec = {
        'source-position': lambda x: choice(x, ('below', 'above', 'none')),
        'linenos': lambda x: True if flag(x) is None else False,
    }

    def run(self):

        env = self.state.document.settings.env
        app = env.app

        # filename *or* python code content, but not both
        if self.arguments and self.content:
            raise SphinxError("bokeh-plot:: directive can't have both args and content")

        # process inline examples here
        if self.content:
            app.debug("[bokeh-plot] handling inline example in %r", env.docname)
            source = '\n'.join(self.content)
            # need docname not to look like a path
            docname = env.docname.replace("/", "-")
            js_name = "bokeh-plot-%s-inline-%s.js" % (docname, uuid4().hex)
            # the code runner just needs a real path to cd to, this will do
            path = join(env.bokeh_plot_auxdir, js_name)

            (script, js, js_path, source) = _process_script(source, path, env, js_name, env.config.bokeh_plot_use_relative_paths)
            if(env.config.bokeh_plot_use_relative_paths):
                script = script.replace('$REL_PATH$', _get_file_depth_string(env.docname) + 'scripts')
            env.bokeh_plot_files[js_name] = (script, js, js_path, source)

        # process example files here
        else:
            example_path = self.arguments[0][:-3]  # remove the ".py"

            # if it's an "internal" example, the python parser has already handled it
            if example_path in env.bokeh_plot_files:
                app.debug("[bokeh-plot] handling internal example in %r: %s", env.docname, self.arguments[0])
                (script, js, js_path, source) = env.bokeh_plot_files[example_path]
                if(env.config.bokeh_plot_use_relative_paths):
                    script = script.replace('$REL_PATH$', _get_file_depth_string(env.docname) + 'scripts')

            # handle examples external to the docs source, e.g. gallery examples
            else:
                app.debug("[bokeh-plot] handling external example in %r: %s", env.docname, self.arguments[0])
                source = open(self.arguments[0]).read()
                source = decode_utf8(source)
                docname = env.docname.replace("/", "-")
                js_name = "bokeh-plot-%s-external-%s.js" % (docname, uuid4().hex)
                (script, js, js_path, source) = _process_script(source, self.arguments[0], env, js_name, env.config.bokeh_plot_use_relative_paths)
                if(env.config.bokeh_plot_use_relative_paths):
                    script = script.replace('$REL_PATH$', _get_file_depth_string(env.docname) + 'scripts')
                env.bokeh_plot_files[js_name] = (script, js, js_path, source)

        # use the source file name to construct a friendly target_id
        target_id = "%s.%s" % (env.docname, basename(js_path))
        target = nodes.target('', '', ids=[target_id])
        result = [target]

        linenos = self.options.get('linenos', False)
        code = nodes.literal_block(source, source, language="python", linenos=linenos, classes=[])
        set_source_info(self, code)

        source_position = self.options.get('source-position', 'below')

        if source_position == "above": result += [code]

        result += [nodes.raw('', script, format="html")]

        if source_position == "below": result += [code]

        return result

def env_before_read_docs(app, env, docnames):
    # sort to make sure the custom Python file parser gets to process any plot
    # scripts first, since it will save the plot output for use later.
    docnames.sort(key=lambda x: 0 if env.doc2path(x).endswith(".py") else 1)
    for name in [x for x in docnames if env.doc2path(x).endswith(".py")]:
        if not name.startswith(tuple(env.app.config.bokeh_plot_pyfile_include_dirs)):
            env.found_docs.remove(name)
            docnames.remove(name)

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

    files_iter = status_iterator(sorted(files),
                                 'copying bokeh-plot files... ',
                                 'brown',
                                 len(files),
                                 stringify_func=lambda x: basename(x))

    for file in files_iter:
        target = join(app.builder.outdir, "scripts", basename(file))
        ensuredir(dirname(target))
        try:
            copyfile(file, target)
        except OSError as e:
            raise SphinxError('cannot copy local file %r, reason: %s' % (file, e))

def env_purge_doc(app, env, docname):
    """ Remove local files for a given document.

    """
    if docname in env.bokeh_plot_files:
        del env.bokeh_plot_files[docname]

def setup(app):
    """ sphinx config variable to scan .py files in provided directories only """
    app.add_config_value('bokeh_plot_pyfile_include_dirs', [], 'html')
    app.add_config_value('bokeh_plot_use_relative_paths', False, 'html')
    app.add_config_value('bokeh_missing_google_api_key_ok', True, 'html')

    app.add_source_parser('.py', PlotScriptParser)

    app.add_directive('bokeh-plot', BokehPlotDirective)

    app.connect('env-before-read-docs', env_before_read_docs)
    app.connect('builder-inited',       builder_inited)
    app.connect('html-page-context',    html_page_context)
    app.connect('build-finished',       build_finished)
    app.connect('env-purge-doc',        env_purge_doc)
