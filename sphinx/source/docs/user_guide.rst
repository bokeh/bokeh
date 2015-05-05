.. _userguide:

User Guide
==========

This user guide is intended to guide you through many common tasks that
you might want to accomplish using Bokeh. The guide is arranged by
topic:

:ref:`userguide_setup`
    Install Bokeh and verify your installation is working correctly.

:ref:`userguide_concepts`
    Define and explain important preliminary concepts.

:ref:`userguide_plotting`
    Use the simple but flexible glyph methods from the |bokeh.plotting|
    interface to construct basic and custom plots.

:ref:`userguide_charts`
    Use the high-level |bokeh.charts| interface to create common
    statistical charts quickly and easily.

:ref:`userguide_compat`
    Display a wide range of plots created using `Matplotlib`_, `Seaborn`_,
    `pandas`_, or `ggplot.py`_ as Bokeh plots.

:ref:`userguide_styling`
    Customize every visual aspect of Bokeh plots---axes, grids, labels,
    glyphs, and more.

:ref:`userguide_tools`
    Make interactive tools (like pan, zoom, select, and others) available
    on your plots.

:ref:`userguide_layout`
    Combine multiple plots and widgets into specified layouts.

:ref:`userguide_notebook`
    Creating and display interactive plots inside Jupyter/IPython notebooks.

:ref:`userguide_interaction`
    Create more sophisticated interactions including widgets or linked
    panning and selection.

:ref:`userguide_server`
    Deploy the Bokeh Server to build and publish sophisticated data
    applications.

:ref:`userguide_embed`
    Embed static or server-based Bokeh plots and widgets into HTML documents
    in a variety of ways.

:ref:`userguide_info`
    See where to go next for more information and examples.

The examples in the user guide are written to be as minimal as possible,
while illustrating how to accomplish a single task within Bokeh. With a
handful of exceptions, no outside libraries such as NumPy, Pandas, or
Blaze are required to run the examples as written. However, Bokeh works
perfectly well with almost any array or table-like data structure.

----

.. toctree::
    :maxdepth: 2

    user_guide/setup
    user_guide/concepts
    user_guide/plotting
    user_guide/charts
    user_guide/compat
    user_guide/styling
    user_guide/tools
    user_guide/layout
    user_guide/notebook
    user_guide/interaction
    user_guide/server
    user_guide/embed
    user_guide/info

.. |bokeh.charts|   replace:: :ref:`bokeh.charts <bokeh.charts>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. _ggplot.py: https://github.com/yhat/ggplot
.. _Matplotlib: http://matplotlib.org
.. _Pandas: http://pandas.pydata.org
.. _Seaborn: http://web.stanford.edu/~mwaskom/software/seaborn