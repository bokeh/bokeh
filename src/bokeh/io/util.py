#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import logging

log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import sys
from contextlib import contextmanager
from os.path import (
    basename,
    dirname,
    join,
    splitext,
)
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import TYPE_CHECKING, Iterable, Iterator

# Bokeh imports
from .. import __version__
from ..embed._util import ThemePolicy, embed
from ..resources import CDN, INLINE, Resources

if TYPE_CHECKING:
    from tempfile import _TemporaryFileWrapper

    from ..core.has_props import HasProps
    from ..document import Document
    from ..embed._util import ThemeSource
    from ..embed.resources import ResolvedResources, ResourceRequirements
    from ..model import Model
    from ..models.plots import Plot
    from ..models.ui import UIElement
    from ..resources import ResourcesLike, ResourcesMode

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'default_filename',
    'detect_current_filename',
    'temp_filename',
    'tmp_html',
    'get_layout_html',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def default_filename(ext: str) -> str:
    ''' Generate a default filename with a given extension, attempting to use
    the filename of the currently running process, if possible.

    If the filename of the current process is not available (or would not be
    writable), then a temporary file with the given extension is returned.

    Args:
        ext (str) : the desired extension for the filename

    Returns:
        str

    Raises:
        RuntimeError
            If the extensions requested is ".py"

    '''
    if ext == "py":
        raise RuntimeError("asked for a default filename with 'py' extension")

    filename = detect_current_filename()

    if filename is None:
        return temp_filename(ext)

    basedir = dirname(filename) or os.getcwd()

    if _no_access(basedir) or _shares_exec_prefix(basedir):
        return temp_filename(ext)

    name, _ = splitext(basename(filename))
    return join(basedir, name + "." + ext)

def detect_current_filename() -> str | None:
    ''' Attempt to return the filename of the currently running Python process

    Returns None if the filename cannot be detected.
    '''
    import inspect

    filename = None
    frame = inspect.currentframe()
    if frame is not None:
        try:
            while frame.f_back and frame.f_globals.get('__name__') != '__main__':
                frame = frame.f_back

            filename = frame.f_globals.get('__file__')
        finally:
            del frame

    return filename

def temp_filename(ext: str) -> str:
    ''' Generate a temporary, writable filename with the given extension

    '''
    with NamedTemporaryFile(suffix="." + ext, delete=False) as f:
        return f.name

@contextmanager
def tmp_html() -> Iterator[_TemporaryFileWrapper[bytes]]:
    '''Create a named temporary HTML file that is cleaned up on exit.

    According to https://docs.python.org/3/library/tempfile.html#tempfile.NamedTemporaryFile
    in order for named temp files to be safely re-openable on Windows, we need
    to set delete=False, so this context manager explicitly manages the unlink.
    '''
    tmp = NamedTemporaryFile(mode="wb", dir=Path.home(), prefix="bokeh", suffix=".html", delete=False)
    try:
        yield tmp
    finally:
        os.unlink(tmp.name)


class _ExportResources(Resources):
    '''Use local BokehJS and packages while retaining declared URL assets.'''

    def _resolve_package_mode(self) -> ResourcesMode:
        return INLINE

    def resolve(self, requirements: ResourceRequirements, *, bokeh_version: str = __version__,
            include_requirement_assets: bool = True,
            extension_model_types: Iterable[type[HasProps]] | None = None) -> ResolvedResources:
        from ..embed.resources import ResolvedResources, ResourceRequirements

        components = Resources(
            mode="inline", minified=self.minified, base_dir=self.base_dir, nonce=self.nonce,
        ).resolve(ResourceRequirements(requirements.components), bokeh_version=bokeh_version)
        extensions = super().resolve(
            ResourceRequirements((), requirements.extensions), bokeh_version=bokeh_version,
            include_requirement_assets=include_requirement_assets,
            extension_model_types=extension_model_types,
        )
        retained = requirements if include_requirement_assets else requirements.without_extension_assets()
        return ResolvedResources(retained, self, bokeh_version, (*components.assets, *extensions.assets))


def get_layout_html(obj: UIElement | Document, *, resources: ResourcesLike = INLINE,
        width: int | None = None, height: int | None = None,
        theme: ThemeSource = ThemePolicy.SOURCE_OR_CURDOC) -> str:
    '''

    '''
    template = r"""\
    {% block preamble %}
    <style{% if bokeh_nonce %} nonce="{{ bokeh_nonce | e }}"{% endif %}>
        html, body {
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            margin: 0;
            border: 0;
            padding: 0;
            overflow: hidden;
        }
    </style>
    {% endblock %}
    """

    def html() -> str:
        result = embed(obj, theme=theme, callback_policy="suppress")
        policy = Resources.build(resources)
        if policy.mode == INLINE:
            policy = _ExportResources(
                mode=CDN,
                minified=policy.minified,
                override_version=policy.override_version or __version__,
                base_dir=policy.base_dir,
                nonce=policy.nonce,
                crossorigin=policy.crossorigin,
            )
        return result.page(resources=policy, title="", template=template)

    if width is not None or height is not None:
        # Defer this import, it is expensive
        from ..models.plots import Plot
        if not isinstance(obj, Plot):
            from ..util.warnings import warn

            warn("Export method called with width or height argument on a non-Plot model. The size values will be ignored.")
        else:
            with _resized(obj, width, height):
                return html()

    return html()


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _no_access(basedir: str) -> bool:
    ''' Return True if the given base dir is not accessible or writeable

    '''
    return not os.access(basedir, os.W_OK | os.X_OK)

def _shares_exec_prefix(basedir: str) -> bool:
    ''' Whether a give base directory is on the system exex prefix

    '''
    # XXX: exec_prefix has type str so why the check?
    prefix: str | None = sys.exec_prefix
    return prefix is not None and basedir.startswith(prefix)

@contextmanager
def _resized(obj: Plot, width: int | None, height: int | None) -> Iterator[None]:
    old_width = obj.width
    old_height = obj.height

    if width is not None:
        obj.width = width
    if height is not None:
        obj.height = height

    try:
        yield
    finally:
        obj.width = old_width
        obj.height = old_height

#-----------------------------------------------------------------------------
# Shared JavaScript snippets for Selenium and Playwright backends
#-----------------------------------------------------------------------------

# Check whether Bokeh has loaded and created at least one document.
_BOKEH_LOADED_EXPR = """\
typeof Bokeh !== "undefined"
    && Bokeh.documents != null
    && Bokeh.documents.length != 0\
"""

# Set a flag once the first Bokeh document becomes idle.
# Both backends poll/wait on ``window._bokeh_render_complete`` afterwards.
_WAIT_SCRIPT = """\
window._bokeh_render_complete = false;
function done() {
  window._bokeh_render_complete = true;
}

const doc = Bokeh.documents[0];

if (doc.is_idle)
  done();
else
  doc.idle.connect(done);
"""

# Embed exports contain one mount. Use its owned views instead of the legacy
# process-wide Bokeh.index registry.
_MOUNT_EXPR = "document.querySelector('[data-bokeh-embed-instance][data-bokeh-root]').bokehMount"

# Read the bounding box enclosing every root view and the device pixel ratio.
# A Document can have several independently mounted roots. Notebook export in
# particular must preserve that complete output instead of silently cropping to
# whichever root happened to be registered first.
_ROOT_VIEW_BBOX_SCRIPT = """\
const output = document.querySelector("[data-bokeh-export-container]");
const rects = output != null
  ? [output.getBoundingClientRect()]
  : $MOUNT.views.map((view) => view.el.getBoundingClientRect());
const left = Math.min(...rects.map((rect) => rect.left));
const top = Math.min(...rects.map((rect) => rect.top));
const right = Math.max(...rects.map((rect) => rect.right));
const bottom = Math.max(...rects.map((rect) => rect.bottom));
return [
  Math.floor(left),
  Math.floor(top),
  Math.ceil(right) - Math.floor(left),
  Math.ceil(bottom) - Math.floor(top),
  window.devicePixelRatio,
];\
""".replace("$MOUNT", _MOUNT_EXPR)

# TODO: consider UIElement like Pane
_SVGS_SCRIPT = """
const {LayoutDOMView} = Bokeh.require("models/layouts/layout_dom")
const {PlotView} = Bokeh.require("models/plots/plot")

function* collect_svgs(views) {
  for (const view of views) {
    if (view instanceof LayoutDOMView) {
      yield* collect_svgs(view.child_views.values())
    }
    if (view instanceof PlotView && view.model.output_backend == "svg") {
      const {ctx} = view.export("svg")
      yield ctx.get_serialized_svg(true)
    }
  }
}

return [...collect_svgs($MOUNT.views)]
""".replace("$MOUNT", _MOUNT_EXPR)

def _SVG_SCRIPT(_obj: Model | Document) -> str:
    return f"""\
function* export_svgs(views) {{
  for (const view of views) {{
    // TODO: use to_blob() API in future
    const {{ctx}} = view.export("svg")
    yield ctx.get_serialized_svg(true)
  }}
}}

return [...export_svgs({_MOUNT_EXPR}.views)]
"""

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
