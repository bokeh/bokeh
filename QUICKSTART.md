
Intro
=====

This document outlines three different ways of installing and getting started
with Bokeh:

* simple install (plots, now!)
* python-only development
* python+js development

Dependencies
============

Python dependencies are listed in requirements.txt at the top level
directory.

**Note**: In some systems you will probably need to install some low level
dependencies. For instance, `redis-server` and `libevent-dev`, a dependency
for `gevent`, are low level dependencies for some Debian-based distributions.

If you plan to do javascript development on BokehJS, please consult
bokehjs/README.md for more details.

Getting the source
==================

You can clone the Bokeh Github repository executing:

    $ git clone https://github.com/ContinuumIO/bokeh

Now you are ready to access to the top-level Bokeh directory:

    $ cd bokeh

Simple Install
==============

This setup is appropriate if you do not need to do any development on Bokeh,
but just want to get up and running (and plotting) as quickly as possible
from a source checkout.

In the top-level Bokeh directory:

    $ python setup.py install

Note: this will use and install the latest built, minified bokeh.js checked
into bokehjs/release.

Now you are ready to generate static plots. In examples/glyphs, try:

    $ python glyph1.py

This will write a static HTML file circle.html in the current directory and
open a browser window to display it. Try running line.py for another static
HTML example.

To utilize the plot server, execute the following in the top-level Bokeh
directory:

    $ python bokeh-server

Now you are ready to generate plots on the plot server. Inside the
directory examples/plotting/server, try:

    $ python rects.py

A browser window should open up to http://localhost:5006/bokeh/, with a gray
header entitled "Document: rects.py example".  Click on the title to view the
plots within the document.  Try running glyphs.py for more plot server
examples.


Python-only Development
=======================

This setup is appropriate when you need to develop on the client-side Python
parts of Bokeh, but do not need to develop on the browser-side Javascript
parts of BokehJS.

In the top-level Bokeh directory:

    $ python setup.py develop

Note: this will use and install the latest built, minified bokeh.js checked
into bokehjs/release.

If you would like to run any examples that utilize the bokeh plot server, start
it in the top level directory:

    $ python bokeh-server -d

Note: bokeh-server currently requires redis, which is only available on OSX
and Linux.

Now you are ready to plot:

    $ cd examples/plotting/server
    $ python iris.py
    $ python burtin.py

All the plots you create will reflect any changes you make to the Bokeh python
library.

To run the test suite you can use one of the following commands:

    $ nosetests
or

    $ nosetests --with-coverage
or

    $ python -c 'from bokeh import test; test()'


Python+JS Development
=====================

This setup appropriate when you need to develop on both the client-side python
parts of Bokeh, and the browser-side javascript parts of BokehJS. It is
necessary to have a working tool chain to build BokehJS. Please consult
[bokehjs/README.md](https://github.com/ContinuumIO/bokeh/blob/master/bokehjs/README.md)
for additional details.

There are two ways to use BokehJS as a single. The first is to use a single, built
bokeh.js file:

single bokeh.js file
--------------------

First build BokehJS. In the top-level Bokeh directory:

    $ cd bokehjs
    $ grunt deploy

Next, install Bokeh. In the top-level Bokeh directory:

    $ python setup.py devjs

Note: this will use and install the un-minified bokeh.js that you just built,
that is located in bokehjs/build.

If you would like to run any examples that utilize the bokeh plot server, start
it in the top level directory:

    $ python bokeh-server -d

Now you are ready to plot:

    $ cd examples/plotting/server
    $ python iris.py
    $ python burtin.py

All the plots you create will reflect any changes you make to the Bokeh python
code in Bokeh/bokeh. If you make any changes you make to the BokehJS
coffeescript code in Bokeh/subtree/bokehjs, you will need to re-rerun the build in
bokehjs (using grunt) and re-run python "setup.py devjs".

The second method is to use AMD/requirejs to load separate submodules of BokehJS on
demand, and to let grunt incrementally compile individuals modules as necessary:

requirejs with grunt
--------------------

Support for this setup, including incremental compilation, coming soon.

