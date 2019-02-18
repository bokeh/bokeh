#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Publish all Bokeh release notes on to a single page.

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

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os import listdir
from os.path import join

# External imports
from packaging.version import Version as V

# Bokeh imports
from .bokeh_directive import BokehDirective

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'BokehReleases',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class BokehReleases(BokehDirective):

    def run(self):
        env = self.state.document.settings.env
        app = env.app

        rst = []

        versions = [x.rstrip(".rst") for x in listdir(join(app.srcdir, 'docs', 'releases'))]
        versions.sort(key=V, reverse=True)

        for v in versions:
            entry = self._parse(".. include:: releases/%s.rst" % v, "<bokeh-releases>")
            rst.extend(entry)

        return rst

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_directive('bokeh-releases', BokehReleases)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
