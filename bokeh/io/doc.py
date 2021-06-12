#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..document import Document

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'curdoc',
    'set_curdoc',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def curdoc() -> Document:
    ''' Return the document for the current default state.

    Returns:
        Document : the current default document object.

    '''
    from .state import curstate
    return curstate().document

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def set_curdoc(doc: Document) -> None:
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
