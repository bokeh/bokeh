""" Bokeh is a Python interactive visualization library that targets modern
web browsers for presentation.

Its goal is to provide elegant, concise construction of novel graphics in the
style of d3.js, but also deliver this capability with high-performance
interactivity over very large or streaming datasets. Bokeh can help anyone
who would like to quickly and easily create interactive plots, dashboards,
and data applications.

For full documentation, please visit: http://bokeh.pydata.org

"""
from __future__ import absolute_import

# configure Bokeh version
from .util.version import __version__; __version__
from .util.version import __base_version__; __base_version__

# configure Bokeh logger
from .util import logconfig
del logconfig

# imports below are names we want to make available in the bokeh
# module as transitive imports

from . import sampledata; sampledata
from .util.testing import runtests as test; test
