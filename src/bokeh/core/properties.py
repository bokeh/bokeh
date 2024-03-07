#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide property types for Bokeh models

Properties are objects that can be assigned as class attributes on Bokeh
models, to provide automatic serialization, validation, and documentation.

This documentation is broken down into the following sections:

.. contents::
    :local:

Overview
--------

There are many property types defined in the module, for example ``Int`` to
represent integral values, ``Seq`` to represent sequences (e.g. lists or
tuples, etc.). Properties can also be combined: ``Seq(Float)`` represents
a sequence of floating point values.

For example, the following defines a model that has integer, string, and
list[float] properties:

.. code-block:: python

    class SomeModel(Model):
        foo = Int
        bar = String(default="something")
        baz = List(Float, help="docs for baz prop")

As seen, properties can be declared as just the property type, e.g.
``foo = Int``, in which case the properties are automatically instantiated
on new Model objects. Or the property can be instantiated on the class,
and configured with default values and help strings.

The properties of this class can be initialized by specifying keyword
arguments to the initializer:

.. code-block:: python

    m = SomeModel(foo=10, bar="a str", baz=[1,2,3,4])

But also by setting the attributes on an instance:

.. code-block:: python

    m.foo = 20

Attempts to set a property to a value of the wrong type will
result in a ``ValueError`` exception:

.. code-block:: python

    >>> m.foo = 2.3
    Traceback (most recent call last):

      << traceback omitted >>

    ValueError: expected a value of type Integral, got 2.3 of type float

Models with properties know how to serialize themselves, to be understood
by BokehJS. Additionally, any help strings provided on properties can be
easily and automatically extracted with the Sphinx extensions in the
:ref:`bokeh.sphinxext` module.


Basic Properties
----------------

.. autoclass:: Alpha
.. autoclass:: Angle
.. autoclass:: Any
.. autoclass:: AnyRef
.. autoclass:: Auto
.. autoclass:: Bool
.. autoclass:: Byte
.. autoclass:: Bytes
.. autoclass:: Color
.. autoclass:: Complex
.. autoclass:: CoordinateLike
.. autoclass:: DashPattern
.. autoclass:: Date
.. autoclass:: Datetime
.. autoclass:: Either
.. autoclass:: Enum
.. autoclass:: Float
.. autoclass:: FontSize
.. autoclass:: Image
.. autoclass:: Int
.. autoclass:: Interval
.. autoclass:: JSON
.. autoclass:: MarkerType
.. autoclass:: MinMaxBounds
.. autoclass:: NonNegative
.. autoclass:: NonNegativeInt
.. autoclass:: Nothing
.. autoclass:: Null
.. autoclass:: Percent
.. autoclass:: Positive
.. autoclass:: PositiveInt
.. autoclass:: RGB
.. autoclass:: Regex
.. autoclass:: Size
.. autoclass:: String
.. autoclass:: Struct
.. autoclass:: Time
.. autoclass:: TimeDelta

Container Properties
--------------------

.. autoclass:: Array
.. autoclass:: ColumnData
.. autoclass:: Dict
.. autoclass:: List
.. autoclass:: RelativeDelta
.. autoclass:: Seq
.. autoclass:: Set
.. autoclass:: Tuple
.. autoclass:: RestrictedDict

DataSpec Properties
-------------------

.. autoclass:: AlphaSpec
.. autoclass:: AngleSpec
.. autoclass:: ColorSpec
.. autoclass:: DataSpec
.. autoclass:: DistanceSpec
.. autoclass:: FontSizeSpec
.. autoclass:: MarkerSpec
.. autoclass:: NumberSpec
.. autoclass:: SizeSpec
.. autoclass:: StringSpec
.. autoclass:: UnitsSpec

Helpers
~~~~~~~

.. autofunction:: expr
.. autofunction:: field
.. autofunction:: value

Special Properties
------------------

.. autoclass:: Instance
.. autoclass:: InstanceDefault
.. autoclass:: Include
.. autoclass:: Nullable
.. autoclass:: NonNullable
.. autoclass:: NotSerialized
.. autoclass:: Object
.. autoclass:: Override
.. autoclass:: Required
.. autoclass:: TypeOfAttr

Validation-only Properties
--------------------------

.. autoclass:: PandasDataFrame
.. autoclass:: PandasGroupBy

Validation Control
------------------

By default, Bokeh properties perform type validation on values. This helps to
ensure the consistency of any data exchanged between Python and JavaScript, as
well as provide detailed and immediate feedback to users if they attempt to
set values of the wrong type. However, these type checks incur some overhead.
In some cases it may be desirable to turn off validation in specific places,
or even entirely, in order to boost performance. The following API is available
to control when type validation occurs.

.. autoclass:: validate
.. autofunction:: without_property_validation

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

# isort: skip_file

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Alias',
    'Alpha',
    'AlphaSpec',
    'Angle',
    'AngleSpec',
    'Any',
    'AnyRef',
    'Array',
    'Auto',
    'Bool',
    'Byte',
    'Bytes',
    'Color',
    'ColorHex',
    'ColorSpec',
    'ColumnData',
    'Complex',
    'CoordinateLike',
    'DashPattern',
    'DashPatternSpec',
    'DataSpec',
    'Date',
    'Datetime',
    'DeprecatedAlias',
    'Dict',
    'DistanceSpec',
    'Either',
    'Enum',
    'Factor',
    'FactorSeq',
    'Float',
    'FontSize',
    'FontSizeSpec',
    'FontStyleSpec',
    'HatchPatternSpec',
    'HatchPatternType',
    'Image',
    'Include',
    'Instance',
    'InstanceDefault',
    'Int',
    'IntSpec',
    'Interval',
    'JSON',
    'Len',
    'LineCapSpec',
    'LineJoinSpec',
    'List',
    'MarkerSpec',
    'MarkerType',
    'MathString',
    'MinMaxBounds',
    'NonEmpty',
    'NonNegative',
    'NonNegativeInt',
    'NonNullable',
    'NotSerialized',
    'Nothing',
    'Null',
    'NullDistanceSpec',
    'NullStringSpec',
    'Nullable',
    'NumberSpec',
    'Object',
    'Override',
    'PandasDataFrame',
    'PandasGroupBy',
    'Percent',
    'Positive',
    'PositiveInt',
    'RGB',
    'Readonly',
    'Regex',
    'RelativeDelta',
    'Required',
    'RestrictedDict',
    'Seq',
    'Set',
    'Size',
    'SizeSpec',
    'String',
    'StringSpec',
    'Struct',
    'Time',
    'TimeDelta',
    'TextAlignSpec',
    'TextBaselineSpec',
    'TextLike',
    'Tuple',
    'TypeOfAttr',
    'UnitsSpec',
    'UnsetValueError',
    'expr',
    'field',
    'validate',
    'value',
    'without_property_validation',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

from .property.alias import Alias, DeprecatedAlias

from .property.aliases import CoordinateLike

from .property.any import Any
from .property.any import AnyRef

from .property.auto import Auto

from .property.color import Alpha
from .property.color import Color
from .property.color import RGB
from .property.color import ColorHex

from .property.constraints import TypeOfAttr

from .property.container import Array
from .property.container import ColumnData
from .property.container import Dict
from .property.container import Len
from .property.container import List
from .property.container import NonEmpty
from .property.container import Seq
from .property.container import Set
from .property.container import Tuple
from .property.container import RelativeDelta
from .property.container import RestrictedDict

from .property.dataspec import AlphaSpec
from .property.dataspec import AngleSpec
from .property.dataspec import ColorSpec
from .property.dataspec import DashPatternSpec
from .property.dataspec import DataSpec
from .property.dataspec import DistanceSpec
from .property.dataspec import FontSizeSpec
from .property.dataspec import FontStyleSpec
from .property.dataspec import HatchPatternSpec
from .property.dataspec import IntSpec
from .property.dataspec import LineCapSpec
from .property.dataspec import LineJoinSpec
from .property.dataspec import MarkerSpec
from .property.dataspec import NullDistanceSpec
from .property.dataspec import NullStringSpec
from .property.dataspec import NumberSpec
from .property.dataspec import SizeSpec
from .property.dataspec import StringSpec
from .property.dataspec import TextAlignSpec
from .property.dataspec import TextBaselineSpec
from .property.dataspec import UnitsSpec

from .property.datetime import Date
from .property.datetime import Datetime
from .property.datetime import Time
from .property.datetime import TimeDelta

from .property.descriptors import UnsetValueError

from .property.either import Either

from .property.enum import Enum

from .property.factors import Factor
from .property.factors import FactorSeq

from .property.include import Include

from .property.instance import Instance
from .property.instance import InstanceDefault
from .property.instance import Object

from .property.json import JSON

from .property.nothing import Nothing

from .property.nullable import NonNullable
from .property.nullable import Nullable

from .property.numeric import Angle
from .property.numeric import Byte
from .property.numeric import Interval
from .property.numeric import NonNegative
from .property.numeric import NonNegativeInt
from .property.numeric import Percent
from .property.numeric import Positive
from .property.numeric import PositiveInt
from .property.numeric import Size

from .property.override import Override

from .property.pd import PandasDataFrame
from .property.pd import PandasGroupBy

from .property.primitive import Bool
from .property.primitive import Bytes
from .property.primitive import Complex
from .property.primitive import Int
from .property.primitive import Float
from .property.primitive import Null
from .property.primitive import String

from .property.readonly import Readonly

from .property.required import Required

from .property.serialized import NotSerialized

from .property.string import MathString
from .property.string import Regex

from .property.struct import Struct

from .property.text_like import TextLike

from .property.vectorization import expr
from .property.vectorization import field
from .property.vectorization import value

from .property.visual import DashPattern
from .property.visual import FontSize
from .property.visual import HatchPatternType
from .property.visual import Image
from .property.visual import MinMaxBounds
from .property.visual import MarkerType

from .property.validation import validate
from .property.validation import without_property_validation

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
