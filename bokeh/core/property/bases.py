#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide base classes for the Bokeh property system.

.. note::
    These classes form part of the very low-level machinery that implements
    the Bokeh model and property system. It is unlikely that any of these
    classes or their methods will be applicable to any standard usage or to
    anyone who is not directly developing on Bokeh's own infrastructure.

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
import types
from copy import copy

# External imports
import numpy as np

# Bokeh imports
from ...util.dependencies import import_optional
from ...util.string import nice_join
from ..has_props import HasProps
from .descriptor_factory import PropertyDescriptorFactory
from .descriptors import BasicPropertyDescriptor

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

pd = import_optional('pandas')

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

__all__ = (
    'ContainerProperty',
    'DeserializationError',
    'PrimitiveProperty',
    'Property',
    'validation_on',
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class DeserializationError(Exception):
    pass

class Property(PropertyDescriptorFactory):
    ''' Base class for Bokeh property instances, which can be added to Bokeh
    Models.

    Args:
        default (obj or None, optional) :
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

    '''

    # This class attribute is controlled by external helper API for validation
    _should_validate = True

    def __init__(self, default=None, help=None, serialized=None, readonly=False):
        # This is how the descriptor is created in the class declaration.
        if serialized is None:
            self._serialized = False if readonly else True
        else:
            self._serialized = serialized
        self._readonly = readonly
        self._default = default
        self.__doc__ = help
        self.alternatives = []
        self.assertions = []

    def __str__(self):
        return self.__class__.__name__

    @classmethod
    def _sphinx_prop_link(cls):
        ''' Generate a sphinx :class: link to this property.

        '''
        # extra space at the end is unfortunately necessary to appease Sphinx
        return ":class:`~bokeh.core.properties.%s` " % cls.__name__

    @staticmethod
    def _sphinx_model_link(name):
        ''' Generate a sphinx :class: link to given named model.

        '''
        return ":class:`~%s` " % name

    def _sphinx_type(self):
        ''' Generate a Sphinx-style reference to this type for documentation
        automation purposes.

        '''
        return self._sphinx_prop_link()

    def make_descriptors(self, base_name):
        ''' Return a list of ``BasicPropertyDescriptor`` instances to install
        on a class, in order to delegate attribute access to this property.

        Args:
            name (str) : the name of the property these descriptors are for

        Returns:
            list[BasicPropertyDescriptor]

        The descriptors returned are collected by the ``MetaHasProps``
        metaclass and added to ``HasProps`` subclasses during class creation.
        '''
        return [ BasicPropertyDescriptor(base_name, self) ]

    def _may_have_unstable_default(self):
        ''' False if we have a default that is immutable, and will be the
        same every time (some defaults are generated on demand by a function
        to be called).

        '''
        return isinstance(self._default, types.FunctionType)

    @classmethod
    def _copy_default(cls, default):
        ''' Return a copy of the default, or a new value if the default
        is specified by a function.

        '''
        if not isinstance(default, types.FunctionType):
            return copy(default)
        else:
            return default()

    def _raw_default(self):
        ''' Return the untransformed default value.

        The raw_default() needs to be validated and transformed by
        prepare_value() before use, and may also be replaced later by
        subclass overrides or by themes.

        '''
        return self._copy_default(self._default)

    def themed_default(self, cls, name, theme_overrides):
        ''' The default, transformed by prepare_value() and the theme overrides.

        '''
        overrides = theme_overrides
        if overrides is None or name not in overrides:
            overrides = cls._overridden_defaults()

        if name in overrides:
            default = self._copy_default(overrides[name])
        else:
            default = self._raw_default()
        return self.prepare_value(cls, name, default)

    @property
    def serialized(self):
        ''' Whether the property should be serialized when serializing an object.

        This would be False for a "virtual" or "convenience" property that duplicates
        information already available in other properties, for example.
        '''
        return self._serialized

    @property
    def readonly(self):
        ''' Whether this property is read-only.

        Read-only properties may only be modified by the client (i.e., by BokehJS
        in the browser).

        '''
        return self._readonly

    def matches(self, new, old):
        ''' Whether two parameters match values.

        If either ``new`` or ``old`` is a NumPy array or Pandas Series or Index,
        then the result of ``np.array_equal`` will determine if the values match.

        Otherwise, the result of standard Python equality will be returned.

        Returns:
            True, if new and old match, False otherwise

        '''
        if isinstance(new, np.ndarray) or isinstance(old, np.ndarray):
            return np.array_equal(new, old)

        if pd:
            if isinstance(new, pd.Series) or isinstance(old, pd.Series):
                return np.array_equal(new, old)

            if isinstance(new, pd.Index) or isinstance(old, pd.Index):
                return np.array_equal(new, old)

        try:

            # this handles the special but common case where there is a dict with array
            # or series as values (e.g. the .data property of a ColumnDataSource)
            if isinstance(new, dict) and isinstance(old, dict):
                if set(new.keys()) != set(old.keys()):
                    return False
                return all(self.matches(new[k], old[k]) for k in new)

            # FYI Numpy can erroneously raise a warning about elementwise
            # comparison here when a timedelta is compared to another scalar.
            # https://github.com/numpy/numpy/issues/10095
            return new == old

        # if the comparison fails for some reason, just punt and return no-match
        except ValueError:
            return False

    def from_json(self, json, models=None):
        ''' Convert from JSON-compatible values into a value for this property.

        JSON-compatible values are: list, dict, number, string, bool, None

        '''
        return json

    def serialize_value(self, value):
        ''' Change the value into a JSON serializable format.

        '''
        return value

    def transform(self, value):
        ''' Change the value into the canonical format for this property.

        Args:
            value (obj) : the value to apply transformation to.

        Returns:
            obj: transformed value

        '''
        return value

    def validate(self, value, detail=True):
        ''' Determine whether we can set this property from this value.

        Validation happens before transform()

        Args:
            value (obj) : the value to validate against this property type
            detail (bool, options) : whether to construct detailed exceptions

                Generating detailed type validation error messages can be
                expensive. When doing type checks internally that will not
                escape exceptions to users, these messages can be skipped
                by setting this value to False (default: True)

        Returns:
            None

        Raises:
            ValueError if the value is not valid for this property type

        '''
        pass

    def is_valid(self, value):
        ''' Whether the value passes validation

        Args:
            value (obj) : the value to validate against this property type

        Returns:
            True if valid, False otherwise

        '''
        try:
            if validation_on():
                self.validate(value, False)
        except ValueError:
            return False
        else:
            return True

    @classmethod
    def wrap(cls, value):
        ''' Some property types need to wrap their values in special containers, etc.

        '''
        return value

    def prepare_value(self, obj_or_cls, name, value):
        try:
            if validation_on():
                self.validate(value)
        except ValueError as e:
            for tp, converter in self.alternatives:
                if tp.is_valid(value):
                    value = converter(value)
                    break
            else:
                raise e
        else:
            value = self.transform(value)

        if isinstance(obj_or_cls, HasProps):
            obj = obj_or_cls

            for fn, msg_or_fn in self.assertions:
                if isinstance(fn, bool):
                    result = fn
                else:
                    result = fn(obj, value)

                assert isinstance(result, bool)

                if not result:
                    if isinstance(msg_or_fn, str):
                        raise ValueError(msg_or_fn)
                    else:
                        msg_or_fn(obj, name, value)

        return self.wrap(value)

    @property
    def has_ref(self):
        return False

    def accepts(self, tp, converter):
        ''' Declare that other types may be converted to this property type.

        Args:
            tp (Property) :
                A type that may be converted automatically to this property
                type.

            converter (callable) :
                A function accepting ``value`` to perform conversion of the
                value to this property type.

        Returns:
            self

        '''

        tp = ParameterizedProperty._validate_type_param(tp)
        self.alternatives.append((tp, converter))
        return self

    def asserts(self, fn, msg_or_fn):
        ''' Assert that prepared values satisfy given conditions.

        Assertions are intended in enforce conditions beyond simple value
        type validation. For instance, this method can be use to assert that
        the columns of a ``ColumnDataSource`` all collectively have the same
        length at all times.

        Args:
            fn (callable) :
                A function accepting ``(obj, value)`` that returns True if the value
                passes the assertion, or False otherwise.

            msg_or_fn (str or callable) :
                A message to print in case the assertion fails, or a function
                accepting ``(obj, name, value)`` to call in in case the assertion
                fails.

        Returns:
            self

        '''
        self.assertions.append((fn, msg_or_fn))
        return self

class ParameterizedProperty(Property):
    ''' A base class for Properties that have type parameters, e.g.
    ``List(String)``.

    '''

    @staticmethod
    def _validate_type_param(type_param):
        if isinstance(type_param, type):
            if issubclass(type_param, Property):
                return type_param()
            else:
                type_param = type_param.__name__
        elif isinstance(type_param, Property):
            return type_param

        raise ValueError("expected a Property as type parameter, got %s" % type_param)

    @property
    def type_params(self):
        raise NotImplementedError("abstract method")

    @property
    def has_ref(self):
        return any(type_param.has_ref for type_param in self.type_params)

class PrimitiveProperty(Property):
    ''' A base class for simple property types.

    Subclasses should define a class attribute ``_underlying_type`` that is
    a tuple of acceptable type values for the property.

    Example:

        A trivial version of a ``Float`` property might look like:

        .. code-block:: python

            class Float(PrimitiveProperty):
                _underlying_type = (numbers.Real,)

    '''

    _underlying_type = None

    def validate(self, value, detail=True):
        super().validate(value, detail)

        if not (value is None or isinstance(value, self._underlying_type)):
            msg = "" if not detail else "expected a value of type %s, got %s of type %s" % (
                nice_join([ cls.__name__ for cls in self._underlying_type ]), value, type(value).__name__
            )
            raise ValueError(msg)

    def from_json(self, json, models=None):
        if json is None or isinstance(json, self._underlying_type):
            return json
        else:
            expected = nice_join([ cls.__name__ for cls in self._underlying_type ])
            raise DeserializationError("%s expected %s, got %s of type %s" % (self, expected, json, type(json).__name__))

    def _sphinx_type(self):
        return self._sphinx_prop_link()

class ContainerProperty(ParameterizedProperty):
    ''' A base class for Container-like type properties.

    '''

    def _may_have_unstable_default(self):
        # all containers are mutable, so the default can be modified
        return True

def validation_on():
    ''' Check if property validation is currently active

    Returns:
        bool

    '''
    return Property._should_validate

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
