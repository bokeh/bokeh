Bokeh 
=====

Bokeh (pronounced boh-Kay) is an implementation of [Grammar of
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
then you already have most of them installed.

 * [Chaco](https://github.com/enthought/chaco)
 * [Traits](https://github.com/enthought/traits)
 * [Pandas](https://github.com/pydata/pandas)
 * [flask]
 * [redis]
 * [requests]
 * [gevent-websocket]
 * [gevent]


Installation
============

After installing the dependencies (chaco, etc.), run the following:

```
git clone git://github.com/ContinuumIO/Bokeh.git
cd Bokeh
python setup.py install
```
The setup.py will automatically grab the latest compiled javascript from github, so you don't need coffeescript in order to use Bokeh.

Status
======

Bokeh was started in March 2012, and still remains in the
experimental/prototype stage.  It is under active development by contributors
at [Continuum Analytics](http://continuum.io), and with the recent award of a
grant from DARPA, we are able to devote more resources into it, along with
collaborators from Indiana University.  


Web based plotting
==================
Bokeh can currently output to chaco, and publish to the web via a few mechanisms.
 * Bokeh can output static html, which you can load into a browser
 * Bokeh can output static html to the ipython notebook
 * Bokeh can output static html to the ipython notebook, AND connect the notebook to the bokeh web server
 * by navigating to http://localhost:5006/bokeh, you can view Bokeh plots as they are pushed out via websockets
   by the webserver

Static html dump based web plotting examples
============================================
 * `$ python tests/web/facetgrid.py`
 * open up the generated `grid.html` in a web browser
 * open up bokehnotebook.ipynb in the ipython notebook, execute the cells.
 
Server Based Web Plotting Examples
==================================
 * start a redis-server anywhere, using `$ redis-server &`
 * execute `$ python startlocal.py `
 * navigate to `http://localhost:5006/bokeh`
 * execute `$ python examples/webplot_example.py`
 * open up an ipython notebook.  open up cars.ipynb.  Execute that notebook.


What Does the Name "Bokeh" Mean?
================================

"Bokeh" is a [photography term](http://en.wikipedia.org/wiki/Bokeh) for the
aesthetic quality of blurring of an image's background, to focus attention on a
foreground subject.

Developing Bokeh
================

Coffeescript
------------

We're developing most of the javascript using coffeescript, in the 
[bokehjs github repository](https://github.com/ContinuumIO/bokehjs)
which has been included as a subtree.  To develop Bokeh you will need
to [install coffeescript](http://coffeescript.org/#installation), 
which depends on [node.js](http://nodejs.org/).  I recommend using npm -g
to install coffeescript globally.  

Hem
---

We're using our own fork of hem to manage the build process.  
Please clone this repo: https://github.com/ContinuumIO/hem. 
hem will compile coffeescript, combine js files, and support node.js require syntax on the client side

install it by executing

`$ sudo npm link` inside the hem repo.  

This will link hem to your working copy so you get hem changes as we push it out
 * Inside bokeh/server of the Bokeh repo, execute `$ hem server &`.  The hem server will
   serve up coffeescript, compiling them on the fly.
 * If you are developing Bokeh, you should use the debug webserver.  
   start it by executing `$ python startlocaldebug.py`.  The debug webserver is configured
   to ask the hem server for compiled javascript, rather than read the pre-compiled js off of disk.
 * For the embedded plotting examples, or the production server, you will
   need to compile the js yourself,
   * `$ hem build -d`, will build the Bokeh application.js file
   * `$ hem build -d -s slug.notebook.json` will build bokehnotebook.js, which is used for all the notebook examples
   * the `-d` option will prevent hem from uglifying the js, which breaks the notebook
   export at the moment.

