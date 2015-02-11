


.. _devguide_objects:

Bokeh Objects
=============

Low-level Object Interface
--------------------------

Below is a notional diagram that shows many of the most common kinds
of models that comprise the Bokeh object system. To create Bokeh plots, these
objects are created and assembled, and then this object graph is serialized
to JSON. This JSON representation is consumed by the BokehJS client library,
which uses it to render the plot.

Where space permits, the attributes of the model are show inline. Not all
objects are shown below; see the :ref:`refguide` for full details.

.. image:: /_images/objects.png
    :align: center

Models and properties
---------------------

The primary components of the low-level API are models, which are objects
that have attributes that can be automatically serialized in a way that
lets them be reconstituted as Backbone objects within BokehJS. Technically,
models are classes that inherit from `HasProps` at some point::

    from bokeh.properties import HasProps, Int

    class Whatever(HasProps):
        """ `Whatever` model. """

Models can derive from other models as well as mixins that provide common
sets of properties (e.g. see :class:`~bokeh.mixins.LineProps`, etc. in :ref:`bokeh_dot_mixins`).
An example might look like this::

    class Another(Whatever, LineProps):
        """ `Another` model. """

Models contain properties, which are class attributes of type
:class:`~bokeh.properties.Property`, e.g::

    class IntProps(HasFields):

        prop1 = Int
        prop2 = Int()
        prop3 = Int(10)

The `IntProps` model represents objects that have three integer values,
``prop1``, ``prop2``, and ``prop3``, that can be automatically serialized
from python, and unserialized by BokehJS.

.. note::
    Technically, ``prop1`` isn't an instance of ``Int``, but ``HasFields`` uses a
    metaclass that automatically instantiates `Property` classes when necessary,
    so ``prop1`` and ``prop2`` are equivalent (though independent) properties.
    This is useful for readability; if you don't need to pass any arguments to
    property's constructor then prefer the former over the later.

There is wide variety of property types, ranging from primitive types such as:

* :class:`~bokeh.properties.Byte`
* :class:`~bokeh.properties.Int`
* :class:`~bokeh.properties.Float`
* :class:`~bokeh.properties.Complex`
* :class:`~bokeh.properties.String`

As well as container-like properties, that take other Properties as parameters:

* :class:`~bokeh.properties.List` --- for a list of one type of objects: ``List(Int)``
* :class:`~bokeh.properties.Dict` --- for a mapping between two type: ``Dict(String, Double)``

and finally some specialized types like

* :class:`~bokeh.properties.Instance` --- to hold a reference to another model: ``Instance(Plot)``
* :class:`~bokeh.properties.Enum` --- to represent enumerated values: ``Enum("foo", "bar", "baz")``
* :class:`~bokeh.properties.Either` --- to create a union type: ``Either(Int, String)``
* :class:`~bokeh.properties.Range` --- to restrict values to a given range: ``Instance(Plot)``

The primary benefit of these property types is that validation can be performed
and meaningful error reporting can occur when an attempt is made to assign an
invalid type or value.

.. warning::
    There is an :class:`~bokeh.properties.Any` that is the super-type of all other
    types, and will accept any type of value. Since this circumvents all type validation,
    make sure to use it sparingly, it at all.

See :ref:`bokeh_dot_properties` for full details.

An example of a more complex, realistic model might look like this::

    class Sample(HasProps, FillProps):
        """ `Sample` model. """

        prop1 = Int(127)
        prop2 = Either(Int, List(Int), Dict(String, List(Int)))
        prop3 = Enum("x", "y", "z")
        prop4 = Range(Float, 0.0, 1.0)
        prop5 = List(Instance(Range1d))

There is a special property-like type named :class:`~bokeh.properties.Include`,
that make it simpler to mix in in properties from a mixin using a prefix, e.g.::

    class Includes(HasProps):
        """ `Includes` model. """

        some_props = Include(FillProps)

In this case there is a placeholder property `some_props`, that will be removed
and automatically replaced with all the properties from :class:`~bokeh.mixins.FillProps`,
each with `some_` appended as a prefix.

.. note::
    The prefix can be a valid identifier. If it ends with ``_props`` then ``props``
    will be removed. Adding ``_props`` isn't necessary, but can be useful if a
    property ``some`` already exists in parallel (see ``Plot.title`` as an example).

Using :class:`~bokeh.properties.Include` is equivalent to writing::

    class ExplicitIncludes(HasProps):
        """ `ExplicitIncludes` model. """

        some_fill_color = ColorSpec(default="gray")
        some_fill_alpha = DataSpec(default=1.0)

Note that you could inherit from :class:`~bokeh.mixins.FillProps` in this
case, as well::

    class IncludesExtends(HasProps, FillProps):
        """ `IncludesExtends` model. """

        some = String
        some_props = Include(FillProps)

but note that this is  equivalent to::

    class ExplicitIncludesExtends(HasProps):
        """ `ExplicitIncludesExtends` model. """

        fill_color = ColorSpec(default="gray")
        fill_alpha = DataSpec(default=1.0)
        some = String
        some_fill_color = ColorSpec(default="gray")
        some_fill_alpha = DataSpec(default=1.0)
