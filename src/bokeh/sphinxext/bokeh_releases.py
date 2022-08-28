# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Publish all Bokeh release notes on to a single page.

This directive collect all the release notes files in the ``docs/releases``
subdirectory, and includes them in *reverse version order*. Typical usage:

.. code-block:: rest

    .. toctree::

    .. bokeh-releases::

To avoid warnings about orphaned files, add the following to the Sphinx
``conf.py`` file:

.. code-block:: python

    exclude_patterns = ['docs/releases/*']

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
from os import listdir
from os.path import join

# External imports
from docutils import nodes
from packaging.version import Version as V

# Bokeh imports
from bokeh import __version__
from bokeh.resources import get_sri_hashes_for_version

# Bokeh imports
from . import PARALLEL_SAFE
from .bokeh_directive import BokehDirective
from .templates import SRI_TABLE

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = ("BokehReleases", "setup")

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

class sri_table(nodes.General, nodes.Element):

    @staticmethod
    def visit_html(visitor, node):
        version = node["version"]
        table = node["table"]
        visitor.body.append(f'<button type="button" class="bk-collapsible">Table of SRI Hashes for version {version}</button>')
        visitor.body.append('<div class="bk-collapsible-content">')
        visitor.body.append(SRI_TABLE.render(table=table))
        visitor.body.append("</div>")
        raise nodes.SkipNode

    html = visit_html.__func__, None


class BokehReleases(BokehDirective):
    def run(self):
        rst = []

        srcdir = self.env.app.srcdir
        versions = [x.rstrip(".rst") for x in listdir(join(srcdir, "docs", "releases")) if x.endswith(".rst")]
        versions.sort(key=V, reverse=True)

        for v in versions:
            rst += self.parse(f".. include:: releases/{v}.rst", "<bokeh-releases>")
            try:
                hashes = get_sri_hashes_for_version(v)
                rst += [sri_table(version=v, table=sorted(hashes.items()))]
            except KeyError:
                if v == __version__:
                    raise RuntimeError(f"Missing SRI Hash for full release version {v!r}")

        return rst


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_directive("bokeh-releases", BokehReleases)
    app.add_node(sri_table, html=sri_table.html)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
