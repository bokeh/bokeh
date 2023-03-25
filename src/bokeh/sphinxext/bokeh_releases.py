# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from packaging.version import Version as V

# Bokeh imports
from bokeh import __version__
from bokeh.resources import get_sri_hashes_for_version

# Bokeh imports
from . import PARALLEL_SAFE
from .bokeh_directive import BokehDirective
from .templates import RELEASE_DETAIL

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

class BokehReleases(BokehDirective):
    def run(self):
        srcdir = self.env.app.srcdir
        versions = [x.rstrip(".rst") for x in listdir(join(srcdir, "docs", "releases")) if x.endswith(".rst")]
        versions.sort(key=V, reverse=True)

        rst = []

        for v in versions:
            try:
                hashes = get_sri_hashes_for_version(v)
                rst.append(RELEASE_DETAIL.render(version=v, table=sorted(hashes.items())))
            except KeyError:
                if v == __version__:
                    raise RuntimeError(f"Missing SRI Hash for full release version {v!r}")
                rst.append(RELEASE_DETAIL.render(version=v, table=[]))

        return self.parse("\n".join(rst), "<bokeh-releases>")


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_directive("bokeh-releases", BokehReleases)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
