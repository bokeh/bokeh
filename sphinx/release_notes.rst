.. _release_notes:

#############
Release Notes
#############

v0.4 (Feb 2014)
===============

* Basic MPL interface
* Free public beta of Bokeh plot hosting service at `bokehplots.com <http://bokehplots.com>`_.
* Tool enhancements: "always on" pan tool
* Much enhanced datetime axis, with better performance and "nice" number picking
* Improved testing, including TravisCI integrations and static image output using PhantomJS
* RGBA and color mapped image plots exposed from python
* renderer performance improvements
* python 3 support for bokeh-server
* Source maps & incremental compilation

v0.3 (Nov 2013)
===============

* Refactor bokehjs to use grunt for coffee build
* Merge bokeh and bokehjs repositories
* Various bug fixes
* additional and improved examples and docs

v0.2 (Oct 2013)
===============

* bokeh.plotting interface for schematized plotting, that wraps the low-level interface
* Performance improvements in BokehJS
* Fixed rendering glitches for HiDPI/Retina displays
* Greatly improved Python interface architecture
* Many more examples, much improved docs


v0.1 (Apr 2013)
===============

* Basic low-level interface, consisting of wrapper objects for BokehJS rendering primitives, glyphs, tools
* Beginnings of the ggplot-style interface that wraps the low-level interface
* Simple line/scatter/bar/image plots with a Matplotlib-like interface
* Static HTML output
* Live server output
* IPython notebook embedding capability
* Table widget
* Pan, Zoom, Select, Resize tools
* Initial Python implementation of Abstract Rendering

.. _roadmap:

###################
Roadmap & TODO List
###################

v0.5 (Goal: March 2014)
=======================

* StreamDataSource which automatically, periodically polls a datasource (need to some way highlight data APIs which support CORS; consider using JSONP?)
* Better grid-based layout system; use Cassowary.js for layout solver, and initially just directly implement schematized layouts
* Integrate Abstract Rendering into bokeh server
* New event and interactor architecture
* Data selection architecture, add various inspectors and data selectors (accessible from Python interface)
* Improve rendering loop performance in BokehJS
* Improved annotations and legends
* Frame around plots for consistent look & feel on all Bokeh plots
* Basic widgets
* Better map projections
* Better integration with Matplotlib pylab plotting functions
* Improve ggplot interface / integrate with ggplot python lib
* Touch events
* Animation framework
* CSS styling/theming mechanism
* Improve tools

  - easier interactions with zoom: zoom box or buttons for zoom in/out
  - Reset view
  - Hot corner for resize tool

v0.6 (Goal: May 2014)
=====================

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

