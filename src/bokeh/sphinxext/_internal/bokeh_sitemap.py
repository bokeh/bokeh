# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Generate a ``sitemap.xml`` to aid with search indexing.

The sitemap contains all HTML pages in the completed build, except pages that
set the ``no-sitemap`` metadata field. It is machine readable and used by
search engines to know what pages are available for indexing.

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
from html import escape
from importlib import import_module
from os.path import join
from pathlib import Path
from typing import Any

# External imports
from sphinx.errors import SphinxError

# Bokeh imports
from . import PARALLEL_SAFE, SphinxParallelSpec

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

status_iterator = import_module("sphinx.util.display").status_iterator

__all__ = (
    "build_finished",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


def build_finished(app: Any, exception: Exception | None) -> None:
    """Generate a sitemap from the HTML pages present after the build."""
    if exception is not None or app.builder.format != "html":
        return

    filename = join(app.outdir, "sitemap.xml")
    links = _sitemap_links(app)

    links_iter = status_iterator(links, "adding links to sitemap... ", "brown", len(links), app.verbosity)

    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(_header)
            for link in links_iter:
                http_link = escape(link.strip().replace("https://", "http://"))
                f.write(_item.format(link=http_link))
            f.write(_footer)
    except OSError as e:
        raise SphinxError(f"cannot write sitemap.xml, reason: {e}")


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.connect("build-finished", build_finished)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

_header = """\
<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

"""

_item = """\
   <url>
      <loc>{link}</loc>
   </url>

"""

_footer = """\
</urlset>
"""


def _sitemap_links(app: Any) -> list[str]:
    """Return links for every HTML file in the completed output tree."""
    site = app.config.html_context["SITEMAP_BASE_URL"]
    version = app.config.version
    outdir = Path(app.outdir)
    links: list[str] = []

    for path in outdir.rglob("*.html"):
        relative_path = path.relative_to(outdir)
        pagename = relative_path.with_suffix("").as_posix()
        if "no-sitemap" in app.env.metadata.get(pagename, {}):
            continue
        links.append(f"{site}{version}/{relative_path.as_posix()}")

    return sorted(links)

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
