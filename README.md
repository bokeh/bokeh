bokehjs
=======

About
=====

BokehJS is designed to be a front-end library for
[Bokeh](http://github.com/ContinuumIO/bokeh).  The architecture of the library
facilitates easy manipulation of the components and configuration of a plot
from the server side.

However, it can be used directly from Javascript, without a Plot Server, and
with all its data embedded directly into the page.  All of the examples in
the `demo/` directory showcase this.

Requirements
============

1. You need to have node.js installed.

2. We're using hem for our Coffeescript build tool.  Hem will compile
coffeescript, combine js files, and support node.js require syntax on the
client side.  Clone the Continuum hem repo: 

`$ git clone https://github.com/ContinuumIO/hem`

3. Install hem by executing

`$ sudo npm link` inside the hem repo.  

This will link hem to your working copy so you get hem changes as we push it out.
(If ever you pull updates into the hem checkout, you will need to run `cake` in
order to do an in-place rebuild of the Hem sources themselves.)  This doesn't
happen very often, as we do not make very many changes to Hem.

Demoing
=======

To play with the BokehJS demos and tests, run the following two commands:

`$ hem server -s slug.all.json`

This causes a hem server to start, which will compile coffeescript source
on-demand and serve them up.  Then, in a new window, run the Python 
demo web server:

`$ python demoserver.py debug`

Now, you should be able to visit `http://localhost:5000/demos` and see a list
of demos.

If, for whatever reason, you don't want to have the hem server running, you 
can also build a static Javascript file and use that instead:

`$ hem build -s slug.all.json`
`$ python demoserver.py`

Note that in order to run the demo server in debug mode, you must also use
the hem server.  The reason is that it's very unlikely you will be debugging
BokehJS without modifying coffeescript, and using the hem server ensures
that you are never served stale Javascript.

You can run tests by navigating to `http://localhost:5000/tests`

Deploying
=========

We have separate slug.json files to configure hem with different paths for
testing/demoing and production deployment.  The default slug.json just 
points to the actual BokehJS code, and doesn't include any of the tests
or demos.  (Those sometimes contain lots of test data and really bloat
the size of the output javascript.)

To build a single application.js for Bokeh, do:

`$ hem build`

This produces a file `static/js/application.js` that includes BokehJS
and all of its dependencies.  Passing the `-d` option will cause this
to be un-minified and readable, but inflates the file size by roughly 2X.

Developing & Contributing
=========================

The project is very new but is already quite useful.  We always appreciate
feedback and value contributions.  The core developers are working hard towards
applying Bokeh and BokehJS towards some specific projects, so the dev priorities
will tend to center around those tasks, until the project reaches a point of
stability.  It should be considered alpha software at this point.

Please join the discussion on the [Bokeh mailing list](https://groups.google.com/a/continuum.io/forum/#!forum/bokeh).

