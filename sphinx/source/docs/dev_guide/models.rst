.. _devguide_models:

Working with Bokeh models
=========================

Low-Level Interface
-------------------

Below is a notional diagram that shows many of the most common kinds
of models that comprise the Bokeh object system. To create Bokeh plots, these
objects are created and assembled, and then this object graph is serialized
to JSON. This JSON representation is consumed by the BokehJS client library,
which uses it to render the plot.

Where space permits, the attributes of the model are shown inline. Not all
objects are shown below, and some information might be outdated; see the
|reference guide| for full details.

.. image:: /_images/objects.png
    :align: center

.. note::
    The individual marker classes in the module
    :class:`~bokeh.models.markers` are **deprecated
    as of Bokeh 2.3.0.** Please replace all occurrences of ``Marker`` models
    with :class:`~bokeh.models.glyphs.Scatter` glyphs. For example: instead of
    ``Asterisk()``, use ``Scatter(marker="asterisk")``.

    For backwards compatibility, all markers in this module currently link to
    their respective replacements using the
    :class:`~bokeh.models.glyphs.Scatter` glyph.

Models and Properties
---------------------

The primary components of the low-level API are models, which are objects
that have attributes that can be automatically serialized in a way that
lets them be reconstituted as BokehJS models. Technically, models are classes
that inherit from `HasProps` at some point:

.. code-block:: python

    class Whatever(HasProps):
        """ `Whatever` model. """

Models contain properties, which are class attributes of type
:class:`~bokeh.core.properties.Property`, e.g:

.. code-block:: python

    class IntProps(HasProps):
        prop1 = Int()
        prop2 = Int(10)

The `IntProps` model represents objects that have two integer values,
``prop1`` and ``prop2``, that can be automatically serialized from Python,
and unserialized by BokehJS.

There is a wide variety of property types, ranging from primitive types such as:

* :class:`~bokeh.core.properties.Byte`
* :class:`~bokeh.core.properties.Int`
* :class:`~bokeh.core.properties.Float`
* :class:`~bokeh.core.properties.Complex`
* :class:`~bokeh.core.properties.String`

as well as container-like properties, that take other properties as parameters:

* :class:`~bokeh.core.properties.List` --- for a list of one type of objects: ``List(Int)``
* :class:`~bokeh.core.properties.Dict` --- for a mapping between two type: ``Dict(String, Double)``

to finally some specialized types like:

* :class:`~bokeh.core.properties.Instance` --- to hold a reference to another model: ``Instance(Plot)``
* :class:`~bokeh.core.properties.Enum` --- to represent enumerated values: ``Enum("foo", "bar", "baz")``
* :class:`~bokeh.core.properties.Either` --- to create a union type: ``Either(Int, String)``

The primary benefit of these property types is that validation can be performed,
and meaningful error reporting can occur when an attempt is made to assign an
invalid type or value.

.. warning::
    There is an :class:`~bokeh.core.properties.Any` that is the super-type of all other
    types and will accept any type of value. Since this circumvents all type validation,
    make sure to use it sparingly, if at all.

See :ref:`bokeh.core.properties` for full details.

An example of a more complex, realistic model might look like this:

.. code-block:: python

    class Sample(HasProps):
        prop1 = Int(127)
        prop2 = Either(Int, List(Int), Dict(String, List(Int)))
        prop3 = Enum("x", "y", "z")
        prop4 = Range(Float, 0.0, 1.0)
        prop5 = List(Instance(Range1d))

Include
~~~~~~~

There is a special property-like type named :class:`~bokeh.core.properties.Include`
that makes it simpler to mix in properties from a mixin using a prefix, e.g.:

.. code-block:: python

    class Includes(HasProps):
        some_props = Include(FillProps, prefix="some")

In this case, there is a placeholder property `some_props`, that will be removed
and automatically replaced with all the properties from :class:`~bokeh.core.property_mixins.FillProps`,
each with `some_` appended as a prefix.

Using :class:`~bokeh.core.properties.Include` as above is equivalent to writing:

.. code-block:: python

    class ExplicitIncludes(HasProps):
        some_fill_color = ColorSpec(default="gray")
        some_fill_alpha = DataSpec(default=1.0)

It is possible to leave off the ``prefix`` value:

.. code-block:: python

    class Includes(HasProps):
        some_props = Include(FillProps)

In this case the mixin properties simply have the base property names. The above
code is equivalen to:

.. code-block:: python

    class ExplicitIncludes(HasProps):
        fill_color = ColorSpec(default="gray")
        fill_alpha = DataSpec(default=1.0)
