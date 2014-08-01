###############
Reference Guide
###############

.. contents::
    :local:
    :depth: 3

Low Level Glyph Interface
=========================

Detailed information about the Python and JavaScript glyph interfaces may be found here:

.. toctree::
   :maxdepth: 1

   bokehjs
   glyphs_ref

High Level Plotting Interface
=============================

.. _bokeh_plotting_glyphs:

Glyphs Functions
----------------

.. autofunction:: bokeh.plotting.annular_wedge
.. autofunction:: bokeh.plotting.annulus
.. autofunction:: bokeh.plotting.arc
.. autofunction:: bokeh.plotting.asterisk
.. autofunction:: bokeh.plotting.bezier
.. autofunction:: bokeh.plotting.circle
.. autofunction:: bokeh.plotting.circle_cross
.. autofunction:: bokeh.plotting.circle_x
.. autofunction:: bokeh.plotting.cross
.. autofunction:: bokeh.plotting.diamond
.. autofunction:: bokeh.plotting.diamond_cross
.. autofunction:: bokeh.plotting.image
.. autofunction:: bokeh.plotting.image_rgba
.. autofunction:: bokeh.plotting.image_url
.. autofunction:: bokeh.plotting.inverted_triangle
.. autofunction:: bokeh.plotting.line
.. autofunction:: bokeh.plotting.multi_line
.. autofunction:: bokeh.plotting.oval
.. autofunction:: bokeh.plotting.patch
.. autofunction:: bokeh.plotting.patches
.. autofunction:: bokeh.plotting.quad
.. autofunction:: bokeh.plotting.quadratic
.. autofunction:: bokeh.plotting.ray
.. autofunction:: bokeh.plotting.rect
.. autofunction:: bokeh.plotting.segment
.. autofunction:: bokeh.plotting.square
.. autofunction:: bokeh.plotting.square_cross
.. autofunction:: bokeh.plotting.square_x
.. autofunction:: bokeh.plotting.text
.. autofunction:: bokeh.plotting.triangle
.. autofunction:: bokeh.plotting.wedge
.. autofunction:: bokeh.plotting.x

.. _bokeh_plotting_sessions:

Session Management
------------------

.. autofunction:: bokeh.plotting.output_cloud
.. autofunction:: bokeh.plotting.output_file
.. autofunction:: bokeh.plotting.output_notebook
.. autofunction:: bokeh.plotting.output_server
.. autofunction:: bokeh.plotting.cursession

.. _bokeh_plotting_plots:

Plot Manipulation
-----------------

.. autofunction:: bokeh.plotting.curplot
.. autofunction:: bokeh.plotting.figure
.. autofunction:: bokeh.plotting.hold
.. autofunction:: bokeh.plotting.gridplot
.. autofunction:: bokeh.plotting.save
.. autofunction:: bokeh.plotting.scatter
.. autofunction:: bokeh.plotting.show

.. _bokeh_plotting_styling:

Styling Accessors
-----------------

.. autofunction:: bokeh.plotting.legend
.. autofunction:: bokeh.plotting.axis
.. autofunction:: bokeh.plotting.xaxis
.. autofunction:: bokeh.plotting.yaxis
.. autofunction:: bokeh.plotting.grid
.. autofunction:: bokeh.plotting.xgrid
.. autofunction:: bokeh.plotting.ygrid

BokehJS Resources
=================

.. automodule:: bokeh.resources
  :members:

Embedding Options
=================

The high level interface for embedding is located in :mod:`bokeh.embed`:

`bokeh.embed`
-------------


.. automodule:: bokeh.embed
  :members:

The underlying templates for embedding are exposed in :mod:`bokeh.templates`:

`bokeh.templates`
-----------------

.. automodule:: bokeh.templates

Compatibility Layers
====================

Coming Soon.

Underlying Object System
========================

`bokeh.objects`
---------------

.. inheritance-diagram:: bokeh.objects
  :parts: 1

.. automodule:: bokeh.objects
    :members:

`bokeh.properties`
------------------

.. inheritance-diagram:: bokeh.properties
  :parts: 1

.. automodule:: bokeh.properties
    :members:


