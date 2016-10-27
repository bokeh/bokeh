.. _userguide_extensions_examples_widget:

Adding A Custom Widget
----------------------

This example shows how to add a double-ended slider widget to the plot.

The single normal Bokeh slider controls the power of the line.
The double ended sliders control the x range for the line.

.. .. bokeh-plot:: docs/user_guide/examples/extensions_example_widget_plot.py
..    :source-position: none

Python script:

.. literalinclude:: ../examples/extensions_example_widget._py
   :language: python

Coffeescript for ion range slider:

.. literalinclude:: ../examples/extensions_ion_range_slider.coffee
   :language: coffee

Eco template for ion range slider:

.. literalinclude:: ../examples/extensions_ion_range_slider_template.eco
