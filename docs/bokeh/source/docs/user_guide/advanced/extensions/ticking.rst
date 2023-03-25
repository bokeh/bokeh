:orphan:

.. _ug_advanced_extensions_examples_ticking:

Specialized axis ticking
------------------------

This example shows how to create a custom ``TickFormatter`` class that displays
the first tick of every axis as-is, and every subsequent tick as an offset from
the first. Pan and zoom the plot below and watch the x-axis.

.. bokeh-plot:: __REPO__/examples/advanced/extensions/ticking.py
    :source-position: below
