#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the Either property.

The Either property is used to construct properties that an accept any of
multiple possible types.

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

# External imports

# Bokeh imports
from ...util.string import nice_join
from .bases import DeserializationError, ParameterizedProperty

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Either',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Either(ParameterizedProperty):
    ''' Accept values according to a sequence of other property types.

        Example:

        .. code-block:: python

            >>> class EitherModel(HasProps):
            ...     prop = Either(Bool, Int, Auto)
            ...

            >>> m = EitherModel()

            >>> m.prop = True

            >>> m.prop = 10

            >>> m.prop = "auto"

            >>> m.prop = 10.3   # ValueError !!

            >>> m.prop = "foo"  # ValueError !!

    '''

    def __init__(self, tp1, tp2, *type_params, **kwargs):
        self._type_params = list(map(self._validate_type_param, (tp1, tp2) + type_params))
        help = kwargs.get("help")
        def choose_default():
            return self._type_params[0]._raw_default()
        default = kwargs.get("default", choose_default)
        super(Either, self).__init__(default=default, help=help)
        self.alternatives = []
        for tp in self._type_params:
            self.alternatives.extend(tp.alternatives)

    # TODO (bev) get rid of this?
    def __or__(self, other):
        return self.__class__(*(self.type_params + [other]), default=self._default, help=self.help)

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, ", ".join(map(str, self.type_params)))

    @property
    def type_params(self):
        return self._type_params

    def from_json(self, json, models=None):
        for tp in self.type_params:
            try:
                return tp.from_json(json, models)
            except DeserializationError:
                pass
        else:
            raise DeserializationError("%s couldn't deserialize %s" % (self, json))

    def transform(self, value):
        for param in self.type_params:
            try:
                return param.transform(value)
            except ValueError:
                pass

        raise ValueError("Could not transform %r" % value)

    def validate(self, value, detail=True):
        super(Either, self).validate(value, detail)

        if not (value is None or any(param.is_valid(value) for param in self.type_params)):
            msg = "" if not detail else "expected an element of either %s, got %r" % (nice_join(self.type_params), value)
            raise ValueError(msg)

    # TODO (bev) implement this
    # def _may_have_unstable_default(self):
    #     return any(tp._may_have_unstable_default() for tp in self.type_params)

    def _sphinx_type(self):
        return self._sphinx_prop_link() + "( %s )" % ", ".join(x._sphinx_type() for x in self.type_params)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
