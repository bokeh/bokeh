#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the Regex property.



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
import re

# External imports

# Bokeh imports
from .primitive import String

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Regex',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Regex(String):
    ''' Accept strings that match a given regular expression.

    Args:
        default (string or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

        help (str or None, optional) :
            A documentation string for this property. It will be automatically
            used by the :ref:`bokeh.sphinxext.bokeh_prop` extension when
            generating Spinx documentation. (default: None)

        serialized (bool, optional) :
            Whether attributes created from this property should be included
            in serialization (default: True)

        readonly (bool, optional) :
            Whether attributes created from this property are read-only.
            (default: False)

    Example:

        .. code-block:: python

            >>> class RegexModel(HasProps):
            ...     prop = Regex("foo[0-9]+bar")
            ...

            >>> m = RegexModel()

            >>> m.prop = "foo123bar"

            >>> m.prop = "foo"      # ValueError !!

            >>> m.prop = [1, 2, 3]  # ValueError !!

    '''
    def __init__(self, regex, default=None, help=None):
        self.regex = re.compile(regex)
        super(Regex, self).__init__(default=default, help=help)

    def __str__(self):
        return "%s(%r)" % (self.__class__.__name__, self.regex.pattern)

    def validate(self, value, detail=True):
        super(Regex, self).validate(value, detail)

        if not (value is None or self.regex.match(value) is not None):
            msg = "" if not detail else "expected a string matching %r pattern, got %r" % (self.regex.pattern, value)
            raise ValueError(msg)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
