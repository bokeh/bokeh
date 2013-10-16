This is both a TODO list as well as a roadmap document for future versions.

Roadmap
=======

Version 0.2 (Sept 2013)
-----------------------

 * Improved examples and documentation
 * Fixed grid plot
 * Performance optimization of Javascript layer
 * Adding support for colors to be DataSpecs in most glyphs
 * Made bokeh.plotting package more consistent; removing plot() function in favor of scatter/line/bar/etc.

Version 0.3
-----------

 * Redo source tree layout, remove BokehJS subtree and incorporating Sahat's JS suggestions
 * More functioning ggplot aesthetics and some stats functions
 * Abstract Rendering
 * Better grid-based layout system
 * Touch events
 * New logo, frame around plots for consistent look & feel on all Bokeh plots


TODO List
=========

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
 * bindings in other languages


Backends
--------

 * Better support for retina/HiDPI
 * Fix rendering in Chrome on HiDPI
 * Make consistent rendering between all
 * more efficient binary data transfers to bokehjs
 * Touch events for browsers on tablets
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
 * some places just need it
 * Improve source tree layout for JS and build; incorporateSahat's suggestions
   for new BokehJS layout, and remove the subtree from Bokeh, relying instead
   on pre-built JS files (minified and un-minified for debug), as well as
   having clear instructions for how to do dev on both Bokeh and BokehJS at the
   same time.


Docs & Testing
--------------

 * tests: Unit tests, image comparisons for regression
 * better docs/interactive gallery
 * demo improvements
   * code simplification
   * option for static page generation
   * more demos

