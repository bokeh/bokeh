# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

**Inline code** as the content of the directive::

 .. bokeh-plot::

     from bokeh.plotting import figure, output_file, show

     output_file("example.html")

     x = [1, 2, 3, 4, 5]
     y = [6, 7, 6, 4, 5]

     p = figure(title="example", width=300, height=300)
     p.line(x, y, line_width=2)
     p.scatter(x, y, size=10, fill_color="white")

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
    p.scatter(x, y, size=10, fill_color="white")

    show(p)

To enable this extension, add `"bokeh.sphinxext.bokeh_plot"` to the extensions
list in your Sphinx configuration module.

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
from heapq import nlargest
from importlib import import_module
from os import getenv
from os.path import basename, dirname, join
from time import perf_counter
from typing import Any, NamedTuple, cast
from uuid import uuid4

# External imports
from docutils import nodes
from docutils.parsers.rst.directives import choice, flag
from sphinx.errors import SphinxError
from sphinx.util.nodes import set_source_info
from sphinx.util.osutil import copyfile, ensuredir

# Bokeh imports
from bokeh.document import Document
from bokeh.embed import embed
from bokeh.model import Model
from bokeh.util.warnings import BokehDeprecationWarning

# Bokeh imports
# Local imports
from ._internal import PARALLEL_SAFE, SphinxParallelSpec
from ._internal.bokeh_directive import BokehDirective
from ._internal.example_handler import ExampleHandler

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

status_iterator = import_module("sphinx.util.display").status_iterator

__all__ = (
    "BokehPlotDirective",
    "setup",
)

GOOGLE_API_KEY = getenv("GOOGLE_API_KEY")

class _PlotTiming(NamedTuple):
    total: float
    evaluate: float
    serialize: float
    write: float
    docname: str
    source: str

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

class autoload_script(nodes.General, nodes.Element):

    @staticmethod
    def visit_html(visitor: Any, node: Any) -> None:
        script_tag = node["script_tag"]
        height_hint = node["height_hint"]
        if height_hint:
            visitor.body.append(f'<div style="height:{height_hint}px;">')
        visitor.body.append(script_tag)
        if height_hint:
            visitor.body.append("</div>")
        raise nodes.SkipNode

    html = visit_html.__func__, None # type: ignore[attr-defined]

class BokehPlotDirective(BokehDirective):

    has_content = True
    optional_arguments = 2

    @staticmethod
    def _flag(value: str) -> bool:
        flag(value)
        return True

    option_spec = {
        "process-docstring": _flag,
        "source-position": lambda x: choice(x, ("below", "above", "none")),
        "linenos": _flag,
    }

    def run(self) -> list[Any]:
        '''Execute the directive and return its document nodes.

        Returns:
            The nodes representing the source and embedded plot.
        '''
        if getenv("BOKEH_SPHINX_QUICK") == "1":
            return []

        env = cast(Any, self.env)
        source, path = self.process_args_or_content()

        dashed_docname = env.docname.replace("/", "-")

        js_filename = f"bokeh-content-{uuid4().hex}-{dashed_docname}.json"

        try:
            (script_tag, js_path, source, docstring, height_hint) = self.process_source(source, path, js_filename)
        except Exception as e:
            raise SphinxError(f"Error generating {js_filename}: \n\n{e}")
        env.bokeh_plot_files.add((js_path, dirname(env.docname)))

        # use the source file name to construct a friendly target_id
        target_id = f"{dashed_docname}.{basename(js_path)}"
        target = [nodes.target("", "", ids=[target_id])]

        self.process_sampledata(source)

        process_docstring = self.options.get("process-docstring", False)
        intro = self.parse(docstring, '<bokeh-content>') if docstring and process_docstring else []

        above, below = self.process_code_block(source, docstring)

        autoload = [autoload_script(height_hint=height_hint, script_tag=script_tag)]

        return target + intro + above + autoload + below

    def process_code_block(self, source: str, docstring: str | None) -> tuple[list[Any], list[Any]]:
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

        return [], []

    def process_args_or_content(self) -> tuple[str, str]:
        # filename *or* python code content, but not both
        if self.arguments and self.content:
            raise SphinxError("bokeh-plot:: directive can't have both args and content")

        env = cast(Any, self.env)
        if self.content:
            log.debug(f"[bokeh-plot] handling inline content in {env.docname!r}")
            path = env.bokeh_plot_auxdir  # code runner just needs any real path
            return "\n".join(self.content), path

        path = self.arguments[0]
        log.debug(f"[bokeh-plot] handling external content in {env.docname!r}: {path}")
        if path.startswith("__REPO__/"):
            # __REPO__ is an internal/undocumented convention for Bokeh's own docs
            from ._internal import REPO_TOP
            path = join(REPO_TOP, path.replace("__REPO__/", ""))
        elif not path.startswith("/"):
            path = join(env.app.srcdir, path)
        try:
            with open(path) as f:
                return f.read(), path
        except Exception as e:
            raise SphinxError(f"bokeh-plot:: error reading {path!r} for {env.docname!r}: {e!r}")

    def process_source(self, source: str, path: str, js_filename: str) -> tuple[str, str, str, str | None, int | None]:
        '''Evaluate source and write its external artifact payload.

        Args:
            source: The Python source to evaluate.
            path: The source path used for evaluation context.
            js_filename: The artifact payload filename.

        Returns:
            Rendered markup, payload path, source, docstring, and height hint.
        '''
        Model.clear_extensions()

        env = cast(Any, self.env)
        started = perf_counter()
        root, docstring = _evaluate_source(source, path, env)
        evaluated = perf_counter()

        height_hint = cast(Any, root)._sphinx_height_hint()

        js_path = join(env.bokeh_plot_auxdir, js_filename)
        external = embed(root).external(js_filename)
        serialized = perf_counter()

        with open(js_path, "w") as f:
            f.write(external.payload)

        finished = perf_counter()
        env.bokeh_plot_timings.append(_PlotTiming(
            total=finished - started,
            evaluate=evaluated - started,
            serialize=serialized - evaluated,
            write=finished - serialized,
            docname=env.docname,
            source=basename(path),
        ))

        return (external.html, js_path, source, docstring, height_hint)

    def process_sampledata(self, source: str) -> None:

        env = cast(Any, self.env)
        if not hasattr(env, 'solved_sampledata'):
            env.solved_sampledata = []

        file, _ = self.get_source_info()
        # collect links to all standalone examples

        if file is not None and '/docs/examples/' in file and file not in env.solved_sampledata:
            env.solved_sampledata.append(file)
            if not hasattr(env, 'all_sampledata_xrefs'):
                env.all_sampledata_xrefs = []
            if not hasattr(env, 'all_gallery_overview'):
                env.all_gallery_overview = []

            env.all_gallery_overview.append({
                'docname': env.docname,
            })

            regex = r"(:|bokeh\.)sampledata(:|\.| import )\s*(\w+(\,\s*\w+)*)"
            matches = re.findall(regex, source)
            if matches:
                keywords = set()
                for m in matches:
                    keywords.update(m[2].replace(" ","").split(','))
                for keyword in keywords:
                    env.all_sampledata_xrefs.append({
                        'docname': env.docname,
                        'keyword': keyword,
                    })
# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


def builder_inited(app: Any) -> None:
    app.env.bokeh_plot_auxdir = join(app.env.doctreedir, "bokeh_plot")
    ensuredir(app.env.bokeh_plot_auxdir)  # docs/bokeh/build/doctrees/bokeh_plot

    if not hasattr(app.env, "bokeh_plot_files"):
        app.env.bokeh_plot_files = set()
    app.env.bokeh_plot_timings = []


def build_finished(app: Any, exception: Exception | None) -> None:
    files = sorted(app.env.bokeh_plot_files)
    files_iter = status_iterator(files, "copying bokeh-plot files... ", "brown", len(files), app.verbosity, stringify_func=lambda x: basename(x[0]))

    for (file, docpath) in files_iter:
        target = join(app.builder.outdir, docpath, basename(file))
        ensuredir(dirname(target))
        try:
            copyfile(file, target)
        except OSError as e:
            raise SphinxError(f"cannot copy local file {file!r}, reason: {e}")

    timings = app.env.bokeh_plot_timings
    if timings:
        total_seconds = sum(item.total for item in timings)
        evaluate_seconds = sum(item.evaluate for item in timings)
        serialize_seconds = sum(item.serialize for item in timings)
        write_seconds = sum(item.write for item in timings)
        log.info(
            f"Bokeh plot timings: directives={len(timings)} total={total_seconds:.3f}s "
            f"evaluate={evaluate_seconds:.3f}s serialize={serialize_seconds:.3f}s write={write_seconds:.3f}s",
        )
        for timing in nlargest(5, timings, key=lambda timing: timing.total):
            log.info(
                f"Bokeh plot slow: total={timing.total:.3f}s evaluate={timing.evaluate:.3f}s "
                f"serialize={timing.serialize:.3f}s write={timing.write:.3f}s "
                f"{timing.docname} ({timing.source})",
            )

def env_merge_info(app: Any, env: Any, docnames: list[str], other: Any) -> None:
    env.bokeh_plot_files |= other.bokeh_plot_files
    docnames_set = set(docnames)
    env.bokeh_plot_timings.extend(item for item in other.bokeh_plot_timings if item.docname in docnames_set)

def setup(app: Any) -> SphinxParallelSpec:
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
def _replace_google_api_key(source: str, env: Any) -> str:
    if "GOOGLE_API_KEY" not in source:
        return source

    if GOOGLE_API_KEY is None:
        if env.config.bokeh_missing_google_api_key_ok:
            return source.replace("GOOGLE_API_KEY", "MISSING_API_KEY")
        raise SphinxError(
            "The GOOGLE_API_KEY environment variable is not set. Set GOOGLE_API_KEY to a valid API key, "
            "or set bokeh_missing_google_api_key_ok=True in conf.py to build anyway (with broken GMaps)",
        )

    return source.replace("GOOGLE_API_KEY", GOOGLE_API_KEY)


def _evaluate_source(source: str, filename: str, env: Any) -> tuple[Model, str | None]:
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


def _remove_module_docstring(source: str, docstring: str | None) -> str:
    if docstring is None:
        return source
    # escape backslashes, see https://docs.python.org/3/library/re.html#re.escape
    docstring = docstring.replace("\\", r"\\")
    return re.sub(rf'(\'\'\'|\"\"\")\s*{re.escape(docstring)}\s*(\'\'\'|\"\"\")', "", source)

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
