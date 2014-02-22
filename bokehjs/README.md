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

1. You need to have node.js and and the node package manager (npm)
installed.

2. We're using Grunt for our Coffeescript build tool.  Grunt will compile
coffeescript, combine js files, and support node.js require syntax on the
client side.  Install grunt by executing

`$ npm install -g grunt-cli`

Building
========

.. note:: The following commands should be executed in the ``bokejs`` subdirectory of the top level checkout.

In order to build the javascript files that comprise bokeh.js, first install
necessary dependencies:

`$ npm install`

These command will install compile and runtime dependencies into node_modules
and build subdirectories, respectively.

To compile the Coffeescript into javascript, execute grunt:

`$ grunt build`

At this point bokeh can be be used as an AMD module together with require.js.
To build a single bokeh.js that may be included as a script, see the section
"Deploying".

Deploying
=========

Grunt can concatenate the javascript files into a single javascript file,
either minified or unminified. To generate a minified script, execute the
command:

`$ grunt mindeploy`

The resulting script will have the filename bokeh.min.js and be located in
the ``build/js`` subdirectory.

To generate an un-minified script, (useful for debugging or developing
bokehjs), execute the command:

`$ grunt devdeploy`

The resulting script will have the filename bokeh.js and be located in
the ``build/js`` subdirectory.

To generate both minified and un-minified output in the ``build/js``
subdirectory, execute the command::

    $ grunt deploy

In both cases, the script creates a top level module "Bokeh" that exposes
the full API.

Demoing
=======

Executing "grunt build" will also cause the demo files to be built and copied
the build/demo subdirectory. To view the demos, simply open any of the html
files located there in a browser.

running `$ ./bokeh-server -j ` and navigating to
[Glyphs Demo](http://localhost:5006/bokehjs/static/demo/glyphs.html) also works.

Testing
=======

In order to run the bokehjs tests, a web server must first be running at the
top level directory. To start the webserver and run the test suite,
just execute the command:

`$ grunt test`

or may be run as part of the default grunt target (which also builds), by
executing the command

`$ grunt`

Developing & Contributing
=========================

The project is very new but is already quite useful.  We always appreciate
feedback and value contributions.  The core developers are working hard towards
applying Bokeh and BokehJS towards some specific projects, so the dev priorities
will tend to center around those tasks, until the project reaches a point of
stability.  It should be considered alpha software at this point.

Please join the discussion on the [Bokeh mailing list](https://groups.google.com/a/continuum.io/forum/#!forum/bokeh).

