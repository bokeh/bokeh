.. _userguide:

User Guide
##########

This user guide presents information about the most common interfaces, tasks,
use-cases, and components of Bokeh. Please also the :ref:`gallery` for many
live examples with code, and the :ref:`tutorial` for a directed walk-through
with worked examples and exercises.

Here is a small glossary of some of the most important concepts in Bokeh,
followed by the extended table of contents for the user guide.

----

BokehJS
   The JavaScript client library that actually renders the visuals and
   handles the UI interactions for Bokeh plots and widgets in the browser.

charts
   Schematic statistical plots such as bar charts, horizon plots, time
   series, etc. that may include faceting, grouping, or stacking based on
   the structure of the data. Bokeh provides a high level ``bokeh.charts``
   interface to quickly construct these kinds of plots. See
   :ref:`userguide_charts` for examples and usage.

embedding
   Various methods of including Bokeh plots and widgets into web apps and
   pages, or the IPython notebook. See :ref:`userguide_embedding` for more
   details.

glyphs
   The basic visual building blocks of Bokeh plots, e.g. lines, rectangles,
   squares, wedges, patches, etc. The ``bokeh.plotting`` interface provides
   a convenient way to create plots centered around glyphs. See
   :ref:`userguide_plotting` for more information.

models
   The lowest-level objects that comprise Bokeh "scenegraphs". These live
   in the ``bokeh.models`` interface. *Most users will not use this level
   of interface to assemble plots directly.* However, ultimately all Bokeh
   plots consist of collections of models, so it is important to understand
   them enough to configure their attributes and properties. See
   :ref:`userguide_objects` for more information.

server
   The ``bokeh-server`` is an optional component that can be used for sharing
   and publishing Bokeh plots and apps, for handling streaming of large data
   sets, or for enabling sophisticated user interactions based off of widgets
   and selections. See :ref:`userguide_server` for more explanation.

widgets
   User interface elements outside of a Bokeh plot such as sliders, drop down
   menues, buttons, etc. Events and updates from widgets can inform additional
   computations, or cause Bokeh plots to update. See :ref:`userguide_widgets`
   for examples and information.

----

.. toctree::
   :maxdepth: 2

   user_guide/interfaces.rst
   user_guide/plotting.rst
   user_guide/charts.rst
   user_guide/objects.rst
   user_guide/server.rst
   user_guide/embedding.rst
   user_guide/widgets.rst
   user_guide/ar.rst
   user_guide/examples.rst
   user_guide/issues.rst

