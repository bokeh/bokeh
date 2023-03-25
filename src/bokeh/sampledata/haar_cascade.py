#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a Haar cascade file for face recognition.

License: `MIT license`_

Sourced from the `OpenCV`_ project.

This module contains an attribute ``frontalface_default_path`` . Use this
attribute to obtain the path to a Haar cascade file for frontal face
recognition that can be used by OpenCV.

.. bokeh-sampledata-xref:: haar_cascade

.. _OpenCV: https://opencv.org
'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Import
#-----------------------------------------------------------------------------

# Bokeh imports
from ..util.sampledata import external_path

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'frontalface_default_path',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

frontalface_default_path = external_path('haarcascade_frontalface_default.xml')

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
