#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide classes for representing RGB(A) and HSL(A) colors, as well as
define common named colors.

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

from .color import Color
from .hsl import HSL
from .rgb import RGB

from . import groups
from . import named

__all__ = (
    'Color',
    'HSL',
    'RGB',
    'groups',
    'named',
)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
