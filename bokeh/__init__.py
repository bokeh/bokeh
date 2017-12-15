#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Bokeh is a Python interactive visualization library that targets modern
web browsers for presentation.

Its goal is to provide elegant, concise construction of versatile graphics,
and also deliver this capability with high-performance interactivity over large
or streaming datasets. Bokeh can help anyone who would like to quickly and
easily create interactive plots, dashboards, and data applications.

For full documentation, please visit: https://bokeh.pydata.org

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

__all__ = (
    '__version__',
    'license',
    'sampledata',
)

# configure Bokeh version
from .util.version import __version__; __version__

def license():
    ''' Print the Bokeh license to the console.

    Returns:
        None

    '''
    from os.path import join
    with open(join(__path__[0], 'LICENSE.txt')) as lic:
        print(lic.read())

# expose sample data module
from . import sampledata; sampledata

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# configure Bokeh logger
from .util import logconfig
del logconfig

# Configure warnings to always show, despite Python's active efforts to hide them from users.
import warnings
from .util.warnings import BokehDeprecationWarning, BokehUserWarning
warnings.simplefilter('always', BokehDeprecationWarning)
warnings.simplefilter('always', BokehUserWarning)
del BokehDeprecationWarning, BokehUserWarning
del warnings
