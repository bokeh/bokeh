
Intro
=====

This document outlines three different ways of installing and getting started with Bokeh:

* simple install (plots, now!)
* python-only development
* python+js development

Dependencies
============

Bokeh currently requires the continuumweb project if you are *developing*:

    $ git clone https://github.com/ContinuumIO/continuumweb.git
    $ cd continuumweb
	$ python setup.py install

Simple Install
==============

This setup is appropriate if you do not need to do any development on Bokeh, but just want to get up and running (and plotting) as quickly as possible.

In the top-level Bokeh directory:

    $ python setup.py install

Now you are ready to generate static plots. In examples/glyphs, try:

    $ python glyph1.py

This will write a static HTML file circle.html in the current directory and open a browser window to display it. Try running line.py for another static HTML example.

To utilize the plot server, execute the following in the top-level Bokeh directory:

    $ python bokeh-server

Now you are ready to generate plots form the server. In examples/plotting/server/, try:

    $ python rects.py

A browser window should open up to http://localhost:5006/bokeh/, with a gray
header entitled "Document: rects.py example".  Click on the title to view the
plots within the document.  Try running glyphs.py for more plot server examples.


Python-only Development
=======================

This setup is appropriate when you need to develop on the client-side Python parts of Bokeh, but do not need to develop on the browser-side Javascript parts of BokehJS.

In the top-level Bokeh directory:

    $ python setup.py develop
    $ python bokeh-server -d &

Now you are ready to plot:

    $ cd examples/glyphs
    $ python glyph1.py
    $ python glyph2.py

All the plots you create will reflect any changes you make to the Bokeh python code in Bokeh/bokeh.


Python+JS Development
=====================

*** These instructions currently do not work. Build is changing in 0.2 release and instructions will be updated then. ***

This setup appropriate when you need to develop on both the client-side python parts of Bokeh, and the browser-side javascript parts of BokehJS.

In the top-level Bokeh directory:

    $ python setup.py develop
    $ ./dev.sh

This will start the plot server and also a hem server. Now you are ready to plot:

    $ cd examples/glyphs
    $ python glyph1.py
    $ python glyph2.py

All the plots you create will reflect any changes you make to the Bokeh python code in Bokeh/bokeh, as well as any changes you make to the BokehJS coffeescript code in Bokeh/subtree/bokehjs.

