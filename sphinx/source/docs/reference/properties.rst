.. _bokeh.properties:

Properties System
=================

In order to streamline and automate the creation and use of models that can
for describing plots and scenes, Bokeh provides a collection of properties
and property mixins. Property classes provide automatic validation and
serialization for a large collection of useful types. Mixin classes provide
for easy bulk addition of properties to model classes.

.. _bokeh.core.properties:

``bokeh.core.properties``
-------------------------

Below is the full class inheritance diagram for all standard Bokeh property
types. Click on any node to be taken to the corresponding documention.

.. inheritance-diagram:: bokeh.core.properties
  :parts: 1

.. automodule:: bokeh.core.properties
    :members:

.. _bokeh.core.property_mixins:

``bokeh.core.property_mixins``
------------------------------

.. autoclass:: bokeh.core.property_mixins.FillProps
    :members:

.. autoclass:: bokeh.core.property_mixins.LineProps
    :members:

.. autoclass:: bokeh.core.property_mixins.TextProps
    :members:
