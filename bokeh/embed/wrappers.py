#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Optional

# Bokeh imports
from ..core.templates import SCRIPT_TAG
from ..util.string import indent

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'wrap_in_onload',
    'wrap_in_safely',
    'wrap_in_script_tag',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def wrap_in_onload(code: str) -> str:
    '''

    '''
    return _ONLOAD % dict(code=indent(code, 4))

def wrap_in_safely(code: str) -> str:
    '''

    '''
    return _SAFELY % dict(code=indent(code, 2))

def wrap_in_script_tag(js: str, type: str="text/javascript", id: Optional[str]=None) -> str:
    '''

    '''
    return SCRIPT_TAG.render(js_code=indent(js, 2), type=type, id=id)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_ONLOAD = """\
(function() {
  var fn = function() {
%(code)s
  };
  if (document.readyState != "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
})();\
"""

_SAFELY = """\
Bokeh.safely(function() {
%(code)s
});\
"""

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
