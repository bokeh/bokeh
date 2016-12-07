.. _userguide_extensions_examples_ticking:

Specialized Axis Ticking
------------------------

This example shows how to create a custom ``TickFormatter`` class that displays
the first tick of every axis as-is, and every subsequent tick as an offset from
the first. Pan and zoom the plot below and watch the x-axis.

.. bokeh-plot:: docs/user_guide/examples/extensions_example_ticking.py
    :source-position: below
