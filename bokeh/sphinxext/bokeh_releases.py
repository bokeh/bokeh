# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Publish all Bokeh release notes on to a single page.

This directive collect all the release notes files in the ``docs/releases``
subdirectory, and includes them in *reverse version order*. Typical usage:

.. code-block:: rest

    :tocdepth: 1

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
from .bokeh_directive import BokehDirective

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

_SRI_SECTION_PRE = """

**Sub-Resource Integrity Hashes**

.. raw:: html

    <div class="expander">
        <a href="javascript:void(0)" class="expander-trigger expander-hidden">Table of SRI Hashes for version %s</a>
        <div class="expander-content">
            <div style="font-size: small;">

.. csv-table::
    :widths: 20, 80
    :header: "Filename", "Hash"

"""

_SRI_SECTION_POST = """
.. raw:: html

            </div>
        </div>
   </div>

"""


class BokehReleases(BokehDirective):
    def run(self):
        env = self.state.document.settings.env
        app = env.app

        rst = []

        versions = [x.rstrip(".rst") for x in listdir(join(app.srcdir, "docs", "releases"))]
        versions.sort(key=V, reverse=True)

        for v in versions:
            rst_text = f".. include:: releases/{v}.rst"
            try:
                hashes = get_sri_hashes_for_version(v)
                rst_text += _SRI_SECTION_PRE % v
                for key, val in sorted(hashes.items()):
                    rst_text += f"    ``{key}``, ``{val}``\n"
                rst_text += _SRI_SECTION_POST
            except KeyError:
                if v == __version__:
                    raise RuntimeError(f"Missing SRI Hash for full release version {v!r}")

            entry = self._parse(rst_text, "<bokeh-releases>")
            rst.extend(entry)

        return rst


def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_directive("bokeh-releases", BokehReleases)


# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
