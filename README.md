Bokeh
=====

Bokeh (pronounced bo-Kay or bo-Kuh) is a Python interactive visualization
library for large datasets that natively uses the latest web technologies.
Its goal is to provide elegant, concise construction of novel graphics in the
style of Protovis/D3, while delivering high-performance interactivity over
large data to thin clients.

Design & Motivation
===================

Bokeh's architecture includes a high-level plotting DSL based on the
[Stencil visualization system](https://github.com/JosephCottam/Stencil) that
is able to express a superset of the statistical binding concepts of the
[Grammar of Graphics](http://www.cs.uic.edu/~wilkinson/TheGrammarOfGraphics/GOG.html)
and the glyph-based visualization constructions of Protovis and D3.  (This DSL
is currently an S-Expr based syntax, but will evolve into a Python embedded DSL.)

There are many excellent plotting packages for Python, but they generally
do not optimize for the particular needs of statistical plotting (easy
faceting, bulk application of aesthetic and visual parameters across
categorical variables, pleasing default color palettes for categorical data,
etc.).  One of the side goals of Bokeh is to provide a compelling Python
equivalent of [ggplot](http://had.co.nz/ggplot/) in R.

Bokeh has several high-level Python interfaces, including a ggplot-like set of
plotting functions, as well as MATLAB-style plotting commands such as
scatter(), line(), and the like.  These are called "schema-oriented" renderers,
and they are wrappers around a low-level set of Python objects, which drive the
Javascript objects in [BokehJS](http://continuumio.github.com/bokehjs/).

The Python interface can either generate static Javascript for embedding in an
HTML file, or output JSON state to be stored in a Redis-backed Plot Server.
(Both forms can be embedded in IPython Notebook.) The latter "server-based"
mode is very powerful because view state is stored on the server, and provides
a much richer level of collaboration in exploratory web-based graphics than is
anything else we are aware of.


Status
======

Bokeh was conceived in March 2012, and still remains in the
experimental/prototype stage.  It is under active development by contributors
at [Continuum Analytics](http://continuum.io), and with the recent award of a
grant from DARPA, we are able to devote more resources into it, along with
collaborators from Indiana University.

Please see `docs/release_notes.md` for the most up-to-date information on the
current release.


Dependencies
============

At a minimum, Bokeh requires the following:

 * Numpy
 * Flask
 * Redis
 * Requests
 * gevent
 * gevent-websocket
 * Pandas

For an older rich-client prototype of some interactive GGplot functionality,
the [Chaco](https://github.com/enthought/chaco) plotting library is also
required.

Although Bokeh only uses Numpy natively, it can also take advantage of
[DataFrames](http://pandas.pydata.org/pandas-docs/stable/dsintro.html#dataframe)
from [Pandas](http://pandas.pydata.org), in order to display tables that support
aggregation and group-by operation.


Installation
============

After installing the dependencies, run the following:

```
git clone git://github.com/ContinuumIO/Bokeh.git
cd Bokeh
python setup.py install
```
The setup.py will automatically install pre-compiled javascript, so you don't
need coffeescript in order to use Bokeh.


Web based plotting
==================
Bokeh can currently do rich-client output via Chaco, and publish to the web
via a few mechanisms.

 * Bokeh can output static html, with data and Javascript embedded
 * Bokeh can output static html to the ipython notebook
 * Bokeh can output static html to the ipython notebook, AND connect the
   notebook to the bokeh web server
 * by navigating to http://localhost:5006/bokeh, you can view Bokeh plots as
   they are pushed out via websockets by the webserver

Static html dump based web plotting examples
============================================
 * Most people will want to look at `examples/plotting/file`, which
   show using the high-level `bokeh.plotting` interface.  This contains
   plotting functions like `scatter()` and `line()` and the like.
 * Low-level Glyph interface examples are in `examples/glyphs/`.  These
   demonstrate the low-level Python object machinery that generates the
   Javascript objects, which are then transported to the BokehJS front-end.
 * Running any of the examples will open up your default browser to look
   at the generated file.  The output HTML files are completely stand-alone,
   and contain all of the data and Javascript.  They can be placed on a
   web server, and visitors to that web page will get the full interactivity.
 * In order to generate smaller HTML files that use relative links to the
   BokehJS sources and CSS, change the calls to `output_file()` and the
   keyword arguments `js="relative", css="relative"`.

Server Based Web Plotting Examples
==================================

 * Execute `bokeh-server` in a terminal.  This will start both an internal
   Redis server and a webserver which will block the terminal.  If you have a
   checkout of Bokeh, be sure to execute the version in your checkout by using
   the full path.  If you have Bokeh installed via a binary build, then you
   should be able to run `bokeh-server` from anywhere.
 * Most of the server-based examples can be found in `examples/plotting/server/`.
   Also, `examples/glyphs/glyph2.py`, `examples/glyphs/prim.py` both use the
   plot server.  Run any of these examples.  They will make a few plots and
   store them on the plot server.
 * Navigate to `http://localhost:5006/bokeh`.  The bokeh client plots
   to named plot namespaces, called 'documents'.  Each example creates
   a new document on the plot server that is named after the example
   itself.  You should see a list of documents on this page in an
   accordion view.  Clicking on one should load the plots for that document.
 * To use the plot server from an IPython Notebook, go to `examples/plotting/notebook`
   and start the IPython Notebook by typing `ipython notebook`.  Then change the
   calls to `output_notebook()` into `output_notebook(url="default")`.  The notebooks
   will look the same as before, but the plots will all be stored on the plot server
   and dynamically served up into the output cells.

Developing Bokeh
================

Bokeh development is complicated by the fact that there is Python code and
Coffeescript in Bokeh itself, and there is Coffeescript in BokehJS.

It is possible to set up just for development on Bokeh, without having a
development install of BokehJS.  To do this, just run `$ python setup.py`.
This will copy the pre-built application.js and bokehnotebook.js files
from the jsbuild/ directory into the correct place in the source tree.

If you want to do development on BokehJS as well, then modify the subtree
source in the `subtree/bokehjs/` directory, and run `$ python exportjs.py`
in the top-level Bokeh directory.  (You must re-run exportjs.py after all
bokehjs changes.)  ONLY DO THIS IF YOU KNOW WHAT YOU ARE DOING!

Coffeescript
------------

To develop Bokeh you will need to [install
coffeescript](http://coffeescript.org/#installation), which depends on
[node.js](http://nodejs.org/).

Hem
---

We're using our own fork of hem to manage the build process.
Please clone this repo: https://github.com/ContinuumIO/hem.
hem will compile coffeescript, combine js files, and support node.js require
syntax on the client side.

Install it by executing

`$ sudo npm link` inside the hem repo.

This will link hem to your working copy so you get hem changes as we push it
out.  Inside `bokeh/server/` of the Bokeh repo, execute `$ hem server &`.  The
hem server will serve up coffeescript, compiling them on the fly.

Developing with Hem Server
--------------------------

To run the debug webserver, execute `$ bokeh-server -d -j`.  The debug
webserver is configured to ask the hem server for compiled javascript, rather
than read the pre-compiled application.js off of disk.

For the embedded plotting examples, or the production server, you will need to
compile the js yourself.

   * Go to the `bokeh/server/` directory.
   * `$ hem build -d` will build the Bokeh application.js file
   * `$ hem build -d -s slug.notebook.json` will build bokehnotebook.js, which
     is used for all the notebook examples
   * the `-d` option will prevent hem from uglifying the js, which breaks the
     notebook export at the moment.

What Does the Name "Bokeh" Mean?
--------------------------------

"Bokeh" is a [photography term](http://en.wikipedia.org/wiki/Bokeh) that refers
to the aesthetic quality of the blur of a photograph's background.

