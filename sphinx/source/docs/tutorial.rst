.. _tutorial:

Tutorial
========

This tutorial is intended to guide you through many common tasks that
you might want to accomplish using Bokeh. The tutorial is arranged by
topic:

:ref:`tutorial_setup`
    Install Bokeh and verify your installation is working correctly.

:ref:`tutorial_plotting`
    Use the simple but flexible glyph methods from the |bokeh.plotting|
    interface to construct basic and custom plots.

:ref:`tutorial_charts`
    Use the high-level |bokeh.charts| interface to create common
    statistical charts quickly and easily.

:ref:`tutorial_styling`
    Customize every visual aspect of Bokeh plots---axes, grids, labels,
    glyphs, and more.

:ref:`tutorial_tools`
    Make interactive tools (like pan, zoom, select, and others) available
    on your plots.

:ref:`tutorial_layout`
    Combine multiple plots and widgets into specified layouts.

:ref:`tutorial_interaction`
    Create more sophisticated interactions including widgets or linked
    panning and selection.

.. :ref:`tutorial_server`
..     Deploy the Bokeh Server to build and publish sophisticated data
..     applications.

:ref:`tutorial_info`
    See where to go next for more information and examples.

The examples in the tutorial are written to be as minimal as possible,
while illustrating how to accomplish a single task within Bokeh. With a
handful of exceptions, no outside libraries such as NumPy, Pandas, or
Blaze are required to run the examples as written. However, Bokeh works
perfectly well with almost any array or table-like data structure. You are
strongly encouraged to **experiment with modifying the examples to use your
own interesting data**.

----

.. toctree::
   :maxdepth: 2

   tutorial/setup
   tutorial/plotting
   tutorial/charts
   tutorial/styling
   tutorial/tools
   tutorial/layout
   tutorial/interaction
   tutorial/server
   tutorial/info

.. |bokeh.charts|   replace:: :ref:`bokeh.charts <bokeh.charts>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
