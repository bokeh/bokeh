#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the Either property.

The Either property is used to construct properties that an accept any of
multiple possible types.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ...util.string import nice_join
from .bases import DeserializationError, ParameterizedProperty
from .singletons import Intrinsic

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
    """ Accept values according to a sequence of other property types.

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

    """

    def __init__(self, tp1, tp2, *type_params, default=Intrinsic, help=None, serialized=None, readonly=False):
        type_params = list(map(self._validate_type_param, (tp1, tp2) + type_params))
        default = default if default is not Intrinsic else type_params[0]._raw_default()
        super().__init__(default=default, help=help, serialized=serialized, readonly=readonly)
        self._type_params = type_params
        for tp in self._type_params:
            self.alternatives.extend(tp.alternatives)

    # TODO (bev) get rid of this?
    def __or__(self, other):
        return self.__class__(*(self.type_params + [other]), default=self._default, help=self.help)

    def __str__(self):
        class_name = self.__class__.__name__
        item_types = ", ".join(str(x) for x in self.type_params)
        return f"{class_name}({item_types})"

    @property
    def type_params(self):
        return self._type_params

    def from_json(self, json, models=None):
        for tp in self.type_params:
            try:
                return tp.from_json(json, models)
            except DeserializationError:
                pass
        raise DeserializationError(f"{self} couldn't deserialize {json}")

    def transform(self, value):
        for param in self.type_params:
            try:
                return param.transform(value)
            except ValueError:
                pass

        raise ValueError("Could not transform {value!r}")

    def validate(self, value, detail=True):
        super().validate(value, detail)

        if any(param.is_valid(value) for param in self.type_params):
            return

        msg = "" if not detail else f"expected an element of either {nice_join(self.type_params)}, got {value!r}"
        raise ValueError(msg)

    # TODO (bev) implement this
    # def _may_have_unstable_default(self):
    #     return any(tp._may_have_unstable_default() for tp in self.type_params)

    def _sphinx_type(self):
        prop_link = self._sphinx_prop_link()
        subtypes = ", ".join(x._sphinx_type() for x in self.type_params)
        return f"{prop_link}({subtypes})"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
