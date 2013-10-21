.. _release_notes:

#############
Release Notes
#############


v0.2 (Oct 2013)
===============

* bokeh.plotting interface for schematized plotting, that wraps the low-level interface
* Performance improvements in BokehJS
* Fixed rendering glitches for HiDPI/Retina displays
* Greatly improved Python interface architecture
* Many more examples, much improved docs


v0.1 (April 2013)
=================

* Basic low-level interface, consisting of wrapper objects for BokehJS
rendering primitives, glyphs, tools
* Beginnings of the ggplot-style interface that wraps the low-level interface
* Simple line/scatter/bar/image plots with a Matplotlib-like interface
* Static HTML output
* Live server output
* IPython notebook embedding capability
* Table widget
* Pan, Zoom, Select, Resize tools
* initial Python implementation of Abstract Rendering

.. _roadmap:

###################
Roadmap & TODO List
###################

v0.3
====

* Redo source tree layout, remove BokehJS subtree and incorporating Sahat's JS suggestions
* Integrate Abstract Rendering into bokeh server
* Better grid-based layout system
* Touch events
* New logo, frame around plots for consistent look & feel on all Bokeh plots
* Improve ggplot interface / integrate with ggplot python lib
* Improve rendering loop performance in BokehJS

v0.4
====

* New event and interactor architecture
* Improved annotations and legends
* Basic widgets
* Better map projections
* Better integration with Matplotlib pylab plotting functions


Long-term TODO List
===================

Core Plotting
-------------

* Axis improvements

  * Improved datetime axis
  * minor ticks
  * good ticking & tick formatting for lat/long axes

* Annotations

  * Arrows, text boxes
  * Improve legend

* graphs/trees
* map projections
* better save capability
* offscreen render, size choice
* Abstract Rendering server
* computed columns, for:

  * stacking bars and areas easily
  * jitter, etc

* streaming data sources
* support for Blaze remote arrays
* publishing support for bokeh-server
* bindings in other languages


Backends
--------

* more efficient binary data transfers to BokehJS
* Check compatibility with mobile browsers


Interactions
------------

* additional selection and inspection tools
* decouple selection reporting from highlighting or other policies
* more general selections (point, line, box, poly, circle)


Code Cleanup
------------

* should use html templates in some places
* css files have lots of cruft

Docs & Testing
--------------

* tests: Unit tests, image comparisons for regression
* better docs/interactive gallery
* demo improvements

   * code simplification
   * option for static page generation
   * more demos

