''' Publish all Bokeh release notes on to a single page.

This directive collect all the release notes files in the ``docs/releases``
subdirectory, and includes them in *reverse version order*. Typical usage:

.. code-block:: rst

    :tocdepth: 1

    .. toctree::

    .. bokeh-releases::

To avoid warnings about orphaned files, add the following to the Sphinx
``conf.py`` file:

.. code-block:: python

    exclude_patterns = ['docs/releases/*']

'''
from __future__ import absolute_import

from os import listdir
from os.path import join

from packaging.version import Version as V

from .bokeh_directive import BokehDirective

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
    app.add_directive('bokeh-releases', BokehReleases)
