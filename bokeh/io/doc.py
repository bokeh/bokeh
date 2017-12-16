#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@general((1,0,0))
def curdoc():
    ''' Return the document for the current default state.

    Returns:
        Document : the current default document object.

    '''
    from .state import curstate
    return curstate().document

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@dev((1,0,0))
def set_curdoc(doc):
    '''Configure the current document (returned by curdoc()).

    Args:
        doc (Document) : Document we will output.

    Returns:
        None

    .. warning::
        Calling this function will replace any existing document.

    '''
    from .state import curstate
    curstate().document = doc

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
