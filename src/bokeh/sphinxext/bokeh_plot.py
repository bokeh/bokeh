# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
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

     p = figure(title="example", width=300, height=300)
     p.line(x, y, line_width=2)
     p.circle(x, y, size=10, fill_color="white")

     show(p)

This directive also works in conjunction with Sphinx autodoc, when
used in docstrings.

The ``bokeh-plot`` directive accepts the following options:

process-docstring (bool):
    Whether to display the docstring in a formatted block
    separate from the source.

source-position (enum('above', 'below', 'none')):
    Where to locate the block of formatted source code (if anywhere).

linenos (bool):
    Whether to display line numbers along with the source.

Examples
--------

The inline example code above produces the following output:

.. bokeh-plot::

    from bokeh.plotting import figure, output_file, show

    output_file("example.html")

    x = [1, 2, 3, 4, 5]
    y = [6, 7, 6, 4, 5]

    p = figure(title="example", width=300, height=300)
    p.line(x, y, line_width=2)
    p.circle(x, y, size=10, fill_color="white")

    show(p)

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# use the wrapped sphinx logger
from sphinx.util import logging  # isort:skip
log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import re
import warnings
from os import getenv
from os.path import basename, dirname, join
from uuid import uuid4

# External imports
from docutils import nodes
from docutils.parsers.rst.directives import choice, flag
from sphinx.errors import SphinxError
from sphinx.util import copyfile, ensuredir, status_iterator
from sphinx.util.nodes import set_source_info

# Bokeh imports
from bokeh.document import Document
from bokeh.embed import autoload_static
from bokeh.model import Model
from bokeh.util.warnings import BokehDeprecationWarning

# Bokeh imports
from . import PARALLEL_SAFE
from .bokeh_directive import BokehDirective
from .example_handler import ExampleHandler
from .util import _REPO_TOP, get_sphinx_resources

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "autoload_script",
    "BokehPlotDirective",
    "setup",
)

GOOGLE_API_KEY = getenv("GOOGLE_API_KEY")

RESOURCES = get_sphinx_resources()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

class autoload_script(nodes.General, nodes.Element):

    @staticmethod
    def visit_html(visitor, node):
        script_tag = node["script_tag"]
        height_hint = node["height_hint"]
        if height_hint:
            visitor.body.append(f'<div style="height:{height_hint}px;">')
        visitor.body.append(script_tag)
        if height_hint:
            visitor.body.append("</div>")
        raise nodes.SkipNode

    html = visit_html.__func__, None

class BokehPlotDirective(BokehDirective):

    has_content = True
    optional_arguments = 2

    option_spec = {
        "process-docstring": lambda x: flag(x) is None,
        "source-position": lambda x: choice(x, ("below", "above", "none")),
        "linenos": lambda x: flag(x) is None,
    }

    def run(self):
        if getenv("BOKEH_SPHINX_QUICK") == "1":
            return []

        source, path = self.process_args_or_content()

        dashed_docname = self.env.docname.replace("/", "-")

        js_filename = f"bokeh-content-{uuid4().hex}-{dashed_docname}.js"

        try:
            (script_tag, js_path, source, docstring, height_hint) = self.process_source(source, path, js_filename)
        except Exception as e:
            raise SphinxError(f"Error generating {js_filename}: \n\n{e}")
        self.env.bokeh_plot_files.add((js_path, dirname(self.env.docname)))

        # use the source file name to construct a friendly target_id
        target_id = f"{dashed_docname}.{basename(js_path)}"
        target = [nodes.target("", "", ids=[target_id])]

        self.process_sampledata(source)

        process_docstring = self.options.get("process-docstring", False)
        intro = self.parse(docstring, '<bokeh-content>') if docstring and process_docstring else []

        above, below = self.process_code_block(source, docstring)

        autoload = [autoload_script(height_hint=height_hint, script_tag=script_tag)]

        return target + intro + above + autoload + below

    def process_code_block(self, source: str, docstring: str|None):
        source_position = self.options.get("source-position", "below")

        if source_position == "none":
            return [], []

        source = _remove_module_docstring(source, docstring).strip()

        linenos = self.options.get("linenos", False)
        code_block = nodes.literal_block(source, source, language="python", linenos=linenos, classes=[])
        set_source_info(self, code_block)

        if source_position == "above":
            return [code_block], []

        if source_position == "below":
            return [], [code_block]

    def process_args_or_content(self):
        # filename *or* python code content, but not both
        if self.arguments and self.content:
            raise SphinxError("bokeh-plot:: directive can't have both args and content")

        if self.content:
            log.debug(f"[bokeh-plot] handling inline content in {self.env.docname!r}")
            path = self.env.bokeh_plot_auxdir  # code runner just needs any real path
            return "\n".join(self.content), path

        path = self.arguments[0]
        log.debug(f"[bokeh-plot] handling external content in {self.env.docname!r}: {path}")
        if path.startswith("__REPO__/"):
            path = join(_REPO_TOP, path.replace("__REPO__/", ""))
        elif not path.startswith("/"):
            path = join(self.env.app.srcdir, path)
        try:
            with open(path) as f:
                return f.read(), path
        except Exception as e:
            raise SphinxError(f"bokeh-plot:: error reading {path!r} for {self.env.docname!r}: {e!r}")

    def process_source(self, source, path, js_filename):
        Model._clear_extensions()

        root, docstring = _evaluate_source(source, path, self.env)

        height_hint = root._sphinx_height_hint()

        js_path = join(self.env.bokeh_plot_auxdir, js_filename)
        js, script_tag = autoload_static(root, RESOURCES, js_filename)

        with open(js_path, "w") as f:
            f.write(js)

        return (script_tag, js_path, source, docstring, height_hint)

    def process_sampledata(self, source):

        if not hasattr(self.env, 'solved_sampledata'):
            self.env.solved_sampledata = []

        file, lineno =  self.get_source_info()
        # collect links to all standalone examples

        if '/docs/examples/' in file and not file in self.env.solved_sampledata:
            self.env.solved_sampledata.append(file)
            if not hasattr(self.env, 'all_sampledata_xrefs'):
                self.env.all_sampledata_xrefs = []
            if not hasattr(self.env, 'all_gallery_overview'):
                self.env.all_gallery_overview = []

            self.env.all_gallery_overview.append({
                'docname': self.env.docname,
            })

            regex = "(:|bokeh\.)sampledata(:|\.| import )\s*(\w+(\,\s*\w+)*)"
            matches = re.findall(regex, source)
            if matches:
                keywords = set()
                for m in matches:
                    keywords.update(m[2].replace(" ","").split(','))
                for keyword in keywords:
                    self.env.all_sampledata_xrefs.append({
                        'docname': self.env.docname,
                        'keyword': keyword,
                    })
# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


def builder_inited(app):
    app.env.bokeh_plot_auxdir = join(app.env.doctreedir, "bokeh_plot")
    ensuredir(app.env.bokeh_plot_auxdir)  # docs/bokeh/build/doctrees/bokeh_plot

    if not hasattr(app.env, "bokeh_plot_files"):
        app.env.bokeh_plot_files = set()


def build_finished(app, exception):
    files = sorted(app.env.bokeh_plot_files)
    files_iter = status_iterator(files, "copying bokeh-plot files... ", "brown", len(files), app.verbosity, stringify_func=lambda x: basename(x[0]))

    for (file, docpath) in files_iter:
        target = join(app.builder.outdir, docpath, basename(file))
        ensuredir(dirname(target))
        try:
            copyfile(file, target)
        except OSError as e:
            raise SphinxError(f"cannot copy local file {file!r}, reason: {e}")

def env_merge_info(app, env, docnames, other):
    env.bokeh_plot_files |= other.bokeh_plot_files

def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_directive("bokeh-plot", BokehPlotDirective)
    app.add_node(autoload_script, html=autoload_script.html)
    app.add_config_value("bokeh_missing_google_api_key_ok", True, "html")
    app.connect("builder-inited", builder_inited)
    app.connect("build-finished", build_finished)
    app.connect("env-merge-info", env_merge_info)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------


# quick and dirty way to inject Google API key
def _replace_google_api_key(source: str, env) -> str:
    if "GOOGLE_API_KEY" not in source:
        return source

    if GOOGLE_API_KEY is None:
        if env.config.bokeh_missing_google_api_key_ok:
            return source.replace("GOOGLE_API_KEY", "MISSING_API_KEY")
        raise SphinxError(
            "The GOOGLE_API_KEY environment variable is not set. Set GOOGLE_API_KEY to a valid API key, "
            "or set bokeh_missing_google_api_key_ok=True in conf.py to build anyway (with broken GMaps)"
        )

    return source.replace("GOOGLE_API_KEY", GOOGLE_API_KEY)


def _evaluate_source(source: str, filename: str, env):
    source = _replace_google_api_key(source, env)

    c = ExampleHandler(source=source, filename=filename)
    d = Document()

    # We may need to instantiate deprecated objects as part of documenting them
    # in the reference guide. Suppress warnings here to keep the build clean
    with warnings.catch_warnings():
        if "reference" in env.docname:
            warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
        c.modify_document(d)

    if c.error:
        raise RuntimeError(f"bokeh-plot:: error:\n\n{c.error_detail}\n\nevaluating source:\n\n{source}")

    if len(d.roots) != 1:
        raise RuntimeError(f"bokeh-plot:: directive expects a single Document root, got {len(d.roots)}")

    return d.roots[0], c.doc.strip() if c.doc else None


def _remove_module_docstring(source, docstring):
    if docstring is None:
        return source
    return re.sub(rf'(\'\'\'|\"\"\")\s*{re.escape(docstring)}\s*(\'\'\'|\"\"\")', "", source)

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
