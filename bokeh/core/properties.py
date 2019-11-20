# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Provide property types for Bokeh models

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

.. autoclass:: Angle
.. autoclass:: Any
.. autoclass:: AnyRef
.. autoclass:: Auto
.. autoclass:: Bool
.. autoclass:: Byte
.. autoclass:: Color
.. autoclass:: Complex
.. autoclass:: DashPattern
.. autoclass:: Date
.. autoclass:: Datetime
.. autoclass:: Either
.. autoclass:: Enum
.. autoclass:: Float
.. autoclass:: FontSize
.. autoclass:: Image
.. autoclass:: Instance
.. autoclass:: Int
.. autoclass:: Interval
.. autoclass:: JSON
.. autoclass:: MarkerType
.. autoclass:: MinMaxBounds
.. autoclass:: NonNegativeInt
.. autoclass:: Percent
.. autoclass:: PositiveInt
.. autoclass:: RGB
.. autoclass:: Regex
.. autoclass:: Size
.. autoclass:: String
.. autoclass:: Struct
.. autoclass:: TimeDelta

Container Properties
--------------------

.. autoclass:: Array
.. autoclass:: ColumnData
.. autoclass:: Dict
.. autoclass:: List
.. autoclass:: RelativeDelta
.. autoclass:: Seq
.. autoclass:: Tuple

DataSpec Properties
-------------------

.. autoclass:: AngleSpec
.. autoclass:: ColorSpec
.. autoclass:: DataDistanceSpec
.. autoclass:: DataSpec
.. autoclass:: DistanceSpec
.. autoclass:: FontSizeSpec
.. autoclass:: MarkerSpec
.. autoclass:: NumberSpec
.. autoclass:: ScreenDistanceSpec
.. autoclass:: StringSpec
.. autoclass:: UnitsSpec

Helpers
~~~~~~~

.. autofunction:: expr
.. autofunction:: field
.. autofunction:: value

Special Properties
------------------

.. autoclass:: Include
.. autoclass:: Override

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

"""
# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (  # noqa: F405
    "Angle",
    "AngleSpec",
    "Any",
    "AnyRef",
    "Array",
    "Auto",
    "Bool",
    "Byte",
    "Color",
    "ColorHex",
    "ColorSpec",
    "ColumnData",
    "Complex",
    "DashPattern",
    "DataDistanceSpec",
    "DataSpec",
    "Date",
    "Datetime",
    "Dict",
    "DistanceSpec",
    "Either",
    "Enum",
    "Float",
    "FontSize",
    "FontSizeSpec",
    "HatchPatternSpec",
    "HatchPatternType",
    "Image",
    "Include",
    "Instance",
    "Int",
    "Interval",
    "JSON",
    "List",
    "MarkerSpec",
    "MarkerType",
    "MinMaxBounds",
    "NonNegativeInt",
    "NumberSpec",
    "Override",
    "PandasDataFrame",
    "PandasGroupBy",
    "Percent",
    "PositiveInt",
    "RGB",
    "Regex",
    "RelativeDelta",
    "ScreenDistanceSpec",
    "Seq",
    "Size",
    "String",
    "StringSpec",
    "Struct",
    "TimeDelta",
    "Tuple",
    "UnitsSpec",
    "expr",
    "field",
    "validate",
    "value",
    "without_property_validation",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

from .property.any import *  # noqa isort:skip
from .property.auto import *  # noqa isort:skip
from .property.color import *  # noqa isort:skip
from .property.container import *  # noqa isort:skip
from .property.dataspec import *  # noqa isort:skip
from .property.datetime import *  # noqa isort:skip
from .property.either import *  # noqa isort:skip
from .property.enum import *  # noqa isort:skip
from .property.include import *  # noqa isort:skip
from .property.instance import *  # noqa isort:skip
from .property.json import *  # noqa isort:skip
from .property.numeric import *  # noqa isort:skip
from .property.override import *  # noqa isort:skip
from .property.pandas import *  # noqa isort:skip
from .property.primitive import *  # noqa isort:skip
from .property.regex import *  # noqa isort:skip
from .property.struct import *  # noqa isort:skip
from .property.visual import *  # noqa isort:skip
from .property.validation import *  # noqa isort:skip

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
