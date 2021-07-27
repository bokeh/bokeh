# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
    Where to locate the the block of formatted source
    code (if anywhere).

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
from bokeh.models import Plot
from bokeh.util.warnings import BokehDeprecationWarning

# Bokeh imports
from .bokeh_directive import BokehDirective
from .example_handler import ExampleHandler
from .util import get_sphinx_resources

# -------------------------`----------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehPlotDirective",
    "setup",
)

GOOGLE_API_KEY = getenv("GOOGLE_API_KEY")

RESOURCES = get_sphinx_resources()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------


class BokehPlotDirective(BokehDirective):

    has_content = True
    optional_arguments = 2

    option_spec = {
        "process-docstring": lambda x: True if flag(x) is None else False,
        "source-position": lambda x: choice(x, ("below", "above", "none")),
        "linenos": lambda x: True if flag(x) is None else False,
    }

    def run(self):

        env = self.state.document.settings.env

        # filename *or* python code content, but not both
        if self.arguments and self.content:
            raise SphinxError("bokeh-plot:: directive can't have both args and content")

        # need docname not to look like a path
        docname = env.docname.replace("/", "-")

        if self.content:
            log.debug(f"[bokeh-plot] handling inline example in {env.docname!r}")
            path = env.bokeh_plot_auxdir  # code runner just needs any real path
            source = "\n".join(self.content)
        else:
            try:
                log.debug(f"[bokeh-plot] handling external example in {env.docname!r}: {self.arguments[0]}")
                path = self.arguments[0]
                if not path.startswith("/"):
                    path = join(env.app.srcdir, path)
                source = open(path).read()
            except Exception as e:
                raise SphinxError(f"{env.docname}: {e!r}")

        js_name = f"bokeh-plot-{uuid4().hex}-external-{docname}.js"

        try:
            (script, js, js_path, source, doc, height_hint) = _process_script(source, path, env, js_name)
        except Exception as e:
            raise SphinxError(f"Sphinx bokeh-plot exception: \n\n{e}\n\n Failed on:\n\n {source}")
        env.bokeh_plot_files[js_name] = (js_path, dirname(env.docname))

        # use the source file name to construct a friendly target_id
        target_id = f"{env.docname}.{basename(js_path)}"
        target = nodes.target("", "", ids=[target_id])
        result = [target]

        process_docstring = self.options.get("process-docstring", False)
        if doc and process_docstring:
            docstring = self._parse(doc, '<bokeh-plot>')
            result += [elem for elem in docstring]
            source = _remove_module_docstring(source, doc)

        above, below = self.process_code_block(source)

        result += above

        element = f'<div style="height:{height_hint}px;">{script}</div>' if height_hint else script
        result += [nodes.raw("", element, format="html")]

        result += below

        return result

    def process_code_block(self, source: str):
        source_position = self.options.get("source-position", "below")
        if source_position == "none":
            return [], []

        source = source.strip()

        linenos = self.options.get("linenos", False)

        code_block = nodes.literal_block(source, source, language="python", linenos=linenos, classes=[])
        set_source_info(self, code_block)

        if source_position == "above":
            return [code_block], []

        if source_position == "below":
            return [], [code_block]

        raise SphinxError(f"Unrecognized source-position for bokeh-plot:: directive: {source_position!r}")

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


def builder_inited(app):
    app.env.bokeh_plot_auxdir = join(app.env.doctreedir, "bokeh_plot")
    ensuredir(app.env.bokeh_plot_auxdir)  # sphinx/_build/doctrees/bokeh_plot

    if not hasattr(app.env, "bokeh_plot_files"):
        app.env.bokeh_plot_files = {}


def build_finished(app, exception):
    files = set()

    for (js_path, docpath) in app.env.bokeh_plot_files.values():
        files.add((js_path, docpath))

    files_iter = status_iterator(sorted(files), "copying bokeh-plot files... ", "brown", len(files), app.verbosity, stringify_func=lambda x: basename(x[0]))

    for (file, docpath) in files_iter:
        target = join(app.builder.outdir, docpath, basename(file))
        ensuredir(dirname(target))
        try:
            copyfile(file, target)
        except OSError as e:
            raise SphinxError(f"cannot copy local file {file!r}, reason: {e}")


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_directive("bokeh-plot", BokehPlotDirective)
    app.add_config_value("bokeh_missing_google_api_key_ok", True, "html")
    app.connect("builder-inited", builder_inited)
    app.connect("build-finished", build_finished)


# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------


def _process_script(source, filename, env, js_name):
    # Explicitly make sure any previous extensions are not included
    Model._clear_extensions()

    root, docstring = _evaluate_source(source, filename, env)

    height_hint = None
    if isinstance(root, Plot):
        if root.sizing_mode in ("stretch_width", "fixed", None):
            height_hint = root.height

    js_path = join(env.bokeh_plot_auxdir, js_name)
    js, script = autoload_static(root, RESOURCES, js_name)

    with open(js_path, "w") as f:
        f.write(js)

    return (script, js, js_path, source, docstring, height_hint)


# quick and dirty way to inject Google API key
def _check_google_api_key(source: str) -> str:
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
    source = _check_google_api_key(source)

    c = ExampleHandler(source=source, filename=filename)
    d = Document()

    # We may need to instantiate deprecated objects as part of documenting
    # them in the reference guide. Suppress any warnings here to keep the
    # docs build clean just for this case
    with warnings.catch_warnings():
        if "reference" in env.docname:
            warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
        c.modify_document(d)

    if c.error:
        raise RuntimeError(f"bokeh-plot:: directive encountered error:\n\n{c.error_detail}")

    if len(d.roots) != 1:
        raise RuntimeError(f"bokeh-plot:: directive expects a single Document root, got {len(d.roots)}")

    return d.roots[0], c.doc.strip() if c.doc else None


def _remove_module_docstring(source, doc):
    return re.sub(rf'(\'\'\'|\"\"\")\s*{re.escape(doc)}\s*(\'\'\'|\"\"\")', "", source)

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
