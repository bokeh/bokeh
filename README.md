Bokeh 
=====

Bokeh is an implementation of [Grammar of
Graphics](http://www.cs.uic.edu/~wilkinson/TheGrammarOfGraphics/GOG.html) for
Python, that also supports the customized rendering flexibility of Protovis and
d3.  Although it is a Python library, its primary output backend is HTML5
Canvas.

There are many excellent plotting packages for Python, but they generally 
do not optimize for the particular needs of statistical plotting (easy faceting,
bulk application of aesthetic and visual parameters across categorical variables,
pleasing default color palettes for categorical data, etc.).  The goal of Bokeh
is to provide a compelling Python equivalent of [ggplot](http://had.co.nz/ggplot/) in R.

A related project is [Pandas](http://pandas.pydata.org), whose [DataFrame](http://pandas.pydata.org/pandas-docs/stable/dsintro.html#dataframe) objects are directly
used by Bokeh.  Bokeh will also interface with the NDTable objects in [Blaze](https://github.com/ContinuumIO/blaze).


Technology
==========

Bokeh has a function-oriented interface that closely resembles ggplot.  These
functions can be used interactively from the Python prompt, or from within a
script (a la [Matplotlib](http://matplotlib.sourceforge.net/)).  Behind the
scenes, these functions construct a scenegraph and data transformation pipeline
that consists of nodes which can export their state into JSON.

The JSON representation of the graphic is then embedded in an HTML document
which also contains the Bokeh JS runtime.  This runtime is built on a port of
[Protovis](http://mbostock.github.com/protovis/) to HTML5 Canvas, and consists
of some higher-level canned plot layouts built on top of the Protovis
framework.

Dependencies
============

For the initial prototype, Bokeh is implemented as a wrapper on top of the
[Chaco](http://code.enthought.com/projects/chaco) plotting system, and displays
its output using Chaco.  This will change as we implement the Javascript/HTML
backend.

You can install the following with easy_install, "pip install", or they may
be available for your Linux system via the system package management.  If you
are using a distribution like [Anaconda Community Edition](https://store.continuum.io/cshop/anaconda),
[Enthought Python Distribution](http://enthought.com/epd), or
[Python(X,Y)](http://code.google.com/p/pythonxy),
then you already have them installed.

 * [Chaco](https://github.com/enthought/chaco)
 * [Traits](https://github.com/enthought/traits)
 * [Pandas](https://github.com/pydata/pandas)


Installation
============

After installing the dependencies (coffeescript, chaco, etc.), run the following:

```
git clone git://github.com/ContinuumIO/Bokeh.git
cd Bokeh
python coffeebuild.py
pip install .
```

Status
======

Bokeh was started in March 2012, and still remains in the
experimental/prototype stage.  It is under active development by contributors
at [Continuum Analytics](http://continuum.io), and with the recent award of a
grant from DARPA, we are able to devote more resources into it, along with
collaborators from Indiana University.  

Coffeescript
============
We're developing most of the javascript using coffeescript, in the 
[bokehjs github repository](https://github.com/ContinuumIO/bokehjs)
which has been included as a subtree.  To execute the code, you will need 
to [install coffeescript](http://coffeescript.org/#installation), 
which depends on [node.js](http://nodejs.org/).  I recommend using npm -g
to install coffeescript globally.  
 * We have a build script, which you can execute calling `$ python coffeebuild.py`
 * We have a watcher script, which you can execute calling `$ python coffeewatch.py`.  
   This will watch for changes in the coffeescript sources, and rebuild if you change 
   any of them.  If you use this option, you should pay attention to the watcher output
   coffeescript compiler errors.

Web based plotting
==================
Bokeh can currently output to chaco, as well as dumping html, or interfacing with
our bokeh web server, which will push plots out to a browser window using websockets.
The following examples assume you have bokeh installed

Server Based Web Plotting Examples
==================================
 * start a redis-server anywhere, using `$ redis-server &`
 * build the coffeescript code as described above.
 * install the bokeh module `$ python setup.py develop`
 * execute `$ python startlocaldebug.py `
 * navigate to `http://localhost:5006/bokeh`
 * execute `$ python examples/webplot_example.py`

Static html dump based web plotting examples
============================================
 * `$ python tests/web/facetgrid.py`
 * open up the generated `grid.html` in a web browser

