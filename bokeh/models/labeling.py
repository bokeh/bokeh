#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Axis labeling policies. """

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
from ..core.has_props import abstract
from ..core.properties import (
    AnyRef,
    Dict,
    Int,
    String,
)
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "AllLabels",
    "CustomLabelingPolicy",
    "LabelingPolicy",
    "NoOverlap",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class LabelingPolicy(Model):
    """ Base class for labeling policies. """

class AllLabels(LabelingPolicy):
    """ Select all labels even if they overlap. """

class NoOverlap(LabelingPolicy):
    """ Basic labeling policy avoiding label overlap. """

    min_distance = Int(default=5, help="""
    Minimum distance between labels in pixels.
    """)

class CustomLabelingPolicy(LabelingPolicy):
    ''' Select labels based on a user-defined policy function.

    .. warning::
        The explicit purpose of this Bokeh Model is to embed *raw JavaScript
        code* for a browser to execute. If any part of the code is derived
        from untrusted user inputs, then you must take appropriate care to
        sanitize the user input prior to passing it to Bokeh.

    '''

    args = Dict(String, AnyRef, help="""
    A mapping of names to Python objects. In particular, those can be Bokeh's models.
    These objects are made available to the labeling policy's code snippet as the
    values of named parameters to the callback.
    """)

    code = String(default="", help="""
    A snippet of JavaScript code that selects a subset of labels for display.

    The following arguments a are available:

      * ``indices``, a set-like object containing label indices to filter
      * ``bboxes``, an array of bounding box objects per label
      * ``distance(i, j)``, a function computing distance (in axis dimensions)
          between labels. If labels i and j overlap, then ``distance(i, j) <= 0``.
      * the keys of ``args`` mapping, if any

    Example:

        Only display labels at even indices:

        .. code-block:: javascript

            code = '''
            for (const i of indices)
              if (i % 2 == 1)
                indices.unset(i)
            '''

        Alternatively, as a generator:

        .. code-block:: javascript

            code = '''
            for (const i of indices)
              if (i % 2 == 0)
                yield i
            '''

    """)
