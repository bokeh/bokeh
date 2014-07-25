.. _release_notes:

#############
Release Notes
#############

v0.5.1 (Jul 2014)
=================
* Hover activated by default
* Boxplot in bokeh.charts
* Better messages when you forgot to start the bokeh-server
* Fixed some packaging bugs
* Fixed NBviewer rendering
* Fixed some Unicodeencodeerror

v0.5.0 (Jul 2014)
=================
* Widgets
* Initial AR integration
* bokeh.charts (scatter, bar, histogram)
* improved embedding API
* minor ticks, plot frame, and log axes

v0.4.4 (Apr 2014)
=================

* Improved MPL interface, subplots, styling plus more examples
* TravisCI testing integration
* Tool enhancements, constrained pan/zoom, more hover glyphs
* Server remote data and downsampling examples
* Initial work for Bokeh "app" concept

v0.4.2 (Mar 2014)
=================

* Improved MPL interface, PolyCollection plus examples
* Extensive tutorial with exercises and solutions
* %bokeh magic for IPython notebook
* InMemory storage backend for bokeh-server (usable without Redis)

v0.4.1 (Feb 2014)
=================

* Improved MPL interface, LineCollection plus examples
* Scala interface
* Categorical axes and ranges
* Hover tool
* Improved pan/zoom tool interactions

v0.4 (Feb 2014)
===============

* Preliminary work on Matplotlib support: convert MPL figures to Bokeh plots
* Free public beta of Bokeh plot hosting at http://bokehplots.com
* Tool improvements:

  - "always on" pan tool and wheel zoom tool
  - box zoom tool
  - viewport reset tool

* Enhanced datetime axis, with better performance and nicer ticking
* Expanded testing, including TravisCI integrations and static image output using PhantomJS
* RGBA and color mapped image plots now available from Python
* Python 3 support!
* Vastly improved documentation for glyphs, with inline examples and JSFiddle integration

v0.3 (Nov 2013)
===============

* refactor bokehjs to use grunt for coffee build
* merge bokeh and bokehjs repositories
* various bug fixes
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
* initial Python implementation of Abstract Rendering


.. _roadmap:

###################
Roadmap & TODO List
###################


v0.6 Goals
=====================
* tighten and document events in bokeh
* integrate kiwi.js for layout
* line and patch point hit testing
* New event and interactor architecture
* Improved annotations and legends
* More widgets
* Object query API

Long-term TODO List
===================

Core Plotting
-------------
* CSS styling/theming mechanism
* Better map projections
* Animation framework
* Improve rendering loop performance in BokehJS

* Axis improvements

  * Improved datetime axis
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

* Touch events
* additional selection and inspection tools
* decouple selection reporting from highlighting or other policies
* more general selections (point, line, box, poly, circle)


Docs & Testing
--------------

* tests: Unit tests, image comparisons for regression
* better docs/interactive gallery
* demo improvements

  * code simplification
  * option for static page generation
  * more demos

