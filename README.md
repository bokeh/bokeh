bokehjs
=======

Requirements
============

1. You need to have node.js installed.

2. Clone the Continuum hem repo: 

`$ git clone https://github.com/ContinuumIO/hem`

We're using hem for our Coffeescript build tool.  Hem will compile
coffeescript, combine js files, and support node.js require syntax on the
client side.

3. Install hem by executing

`$ sudo npm link` inside the hem repo.  

This will link hem to your working copy so you get hem changes as we push it out.
(If ever you pull updates into the hem checkout, you will need to run `cake` in
order to do an in-place rebuild of the Hem sources themselves.)  This doesn't
happen very often, as we do not make very many changes to Hem.

Demoing
=======

To play with the BokehJS demos, run the following two commands:

`$ hem server -s slug.demo.json`

This causes a hem server to start, which will compile coffeescript source
on-demand and serve them up.  Then, in a new window, run the Python 
demo web server:

`$ python demoserver.py debug`

Now, you should be able to visit `http://localhost:5000/demos` and see a list
of demos.

If, for whatever reason, you don't want to have the hem server running, you 
can also build a static Javascript file and use that instead:

`$ hem build -s slug.demo.json`
`$ python demoserver.py`

Note that in order to run the demo server in debug mode, you must also use
the hem server.  The reason is that it's very unlikely you will be debugging
BokehJS without modifying coffeescript, and using the hem server ensures
that you are never served stale Javascript.

Testing
=======

The process for unit tests is very similar to the demos:

`$ hem server -s slug.tests.json`
`$ python demoserver.py debug`  (In a new window)

Navigate to `http://localhost:5000/tests` to see a list of unit tests
you can run.


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

