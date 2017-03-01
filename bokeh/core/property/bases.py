''' Provide base classes for the Bokeh property system.

.. note::
    These classes form part of the very low-level machinery that implements
    the Bokeh model and property system. It is unlikely that any of these
    classes or their methods will be applicable to any standard usage or to
    anyone who is not directly developing on Bokeh's own infrastructure.

'''
from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)

from copy import copy
import types

from six import string_types

from ...util.string import nice_join
from .containers import PropertyValueList, PropertyValueDict
from .descriptor_factory import PropertyDescriptorFactory
from .descriptors import BasicPropertyDescriptor

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

    def __init__(self, default=None, help=None, serialized=True, readonly=False):
        # This is how the descriptor is created in the class declaration.
        self._serialized = False if readonly else serialized
        self._readonly = readonly
        self._default = default
        self.__doc__ = help
        self.alternatives = []
        self.assertions = []

        # "fail early" when a default is invalid
        self.validate(self._raw_default())

    def __str__(self):
        return self.__class__.__name__

    @classmethod
    def _sphinx_prop_link(cls):
        ''' Generate a sphinx :class: link to this property.

        '''
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
        # XXX: originally this code warned about not being able to compare values, but that
        # doesn't make sense, because most comparisons involving numpy arrays will fail with
        # ValueError exception, thus warning about inevitable.
        try:
            if new is None or old is None:
                return new is old           # XXX: silence FutureWarning from NumPy
            else:
                return new == old
        except (KeyboardInterrupt, SystemExit):
            raise
        except Exception:
            # if we cannot compare (e.g. arrays) just punt return False for match
            pass
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

    def validate(self, value):
        ''' Determine whether we can set this property from this value.

        Validation happens before transform()

        Args:
            value (obj) : the value to validate against this property type

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
            self.validate(value)
        except ValueError:
            return False
        else:
            return True

    @classmethod
    def _wrap_container(cls, value):
        if isinstance(value, list):
            if isinstance(value, PropertyValueList):
                return value
            else:
                return PropertyValueList(value)
        elif isinstance(value, dict):
            if isinstance(value, PropertyValueDict):
                return value
            else:
                return PropertyValueDict(value)
        else:
            return value

    def prepare_value(self, obj_or_cls, name, value):
        try:
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

        from ..has_props import HasProps
        if isinstance(obj_or_cls, HasProps):
            obj = obj_or_cls

            for fn, msg_or_fn in self.assertions:
                if isinstance(fn, bool):
                    result = fn
                else:
                    result = fn(obj, value)

                if isinstance(result, bool):
                    if not result:
                        if isinstance(msg_or_fn, string_types):
                            raise ValueError(msg_or_fn)
                        else:
                            msg_or_fn()
                elif result is not None:
                    if isinstance(msg_or_fn, string_types):
                        raise ValueError(msg_or_fn % result)
                    else:
                        msg_or_fn(result)

        return self._wrap_container(value)

    @property
    def has_ref(self):
        return False

    def accepts(self, tp, converter):
        tp = ParameterizedProperty._validate_type_param(tp)
        self.alternatives.append((tp, converter))
        return self

    def asserts(self, fn, msg_or_fn):
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

        raise ValueError("expected a Propertyas type parameter, got %s" % type_param)

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

    def validate(self, value):
        super(PrimitiveProperty, self).validate(value)

        if not (value is None or isinstance(value, self._underlying_type)):
            raise ValueError("expected a value of type %s, got %s of type %s" %
                (nice_join([ cls.__name__ for cls in self._underlying_type ]), value, type(value).__name__))

    def from_json(self, json, models=None):
        if json is None or isinstance(json, self._underlying_type):
            return json
        else:
            expected = nice_join([ cls.__name__ for cls in self._underlying_type ])
            raise DeserializationError("%s expected %s, got %s" % (self, expected, json))

    def _sphinx_type(self):
        return self._sphinx_prop_link()

class ContainerProperty(ParameterizedProperty):
    ''' A base class for Container-like type properties.

    '''

    def _may_have_unstable_default(self):
        # all containers are mutable, so the default can be modified
        return True
