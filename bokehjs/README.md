<img src="http://i.imgur.com/TMKcgIV.png" width="35" height="35"> BokehJS
=========================================================================

BokehJS is a front-end library for [Bokeh](http://github.com/ContinuumIO/bokeh).

The architecture of the library facilitates easy manipulation of the components
and configuration of a plot from the server-side.

However, it can be used directly from JavaScript, without a Plot Server, and
with all its data embedded directly into the page.  All of the examples in
the **demo** directory demonstrate this.

Instructions below outline the steps you need to take to get started with the
BokehJS development on your local machine.

Requirements
------------

1. You need to have [Node.js](http://nodejs.org) installed on your system.

2. This project uses [Grunt.js](http://gruntjs.com) task runner to compile
CoffeeScript, concatenate JavaScript and minify RequireJS modules into a single
file, plus a few other things. Install Grunt.js command line interface by
running the following command:

```bash
npm install -g grunt-cli
```

Building
--------

**Note:** The following commands should be executed inside **bokehjs**
subdirectory.

To build the JavaScript files that comprise BokehJS, first install
necessary dependencies by running the following command:

```bash
npm install
```

Then to compile CoffeeScript into JavaScript run:

```bash
grunt build
```

At this point BokehJS can be be used as an AMD module with RequireJS. This is
fine for debugging purposes during development, but ideally we want to also
have a single JavaScript file that can be included in HTML, inside a `<script>`
tag.

Deploying
---------

Grunt can concatenate RequireJS modules into a single javascript file,
either minified or unminified.

To generate both minified and minified scripts, run the following command:

```bash
grunt deploy
```

The resulting scripts - `bokeh.min.js` and `bokeh.js` will be located in
the **build/js** subdirectory.

This generated script creates a top-level module `Bokeh` that exposes
the full API.

Demoing
-------

Running `grunt build` will also cause the demo files to be built and copied
over to the **build/demo** directory. Some demos may also require running `grunt deploy`. 

To run the demos, simply run `grunt serve` and navigate to [BokehJS Demo Page](http://localhost:8000). Alternatively, you can manually open any of the HTML files located in the **build/demo** directory in a browser.

**Note:** You must run the demos from the **build/demo** directory, which contains the built, runnable demo files. This is not to be confused with the **demo** folder in the top-level directory which contains the unbuilt demo source files.

**Note:** Alternatively, run `$ ./bokeh-server -j ` and navigate to
[Glyphs Demo](http://localhost:5006/bokehjs/static/demo/glyphs.html).

Testing
-------

In order to run BokehJS tests a web server must first be running at the
top level directory. To start the web server and run the test suite,
simply run this command:

```
grunt test
```

![BokehJS Testing](http://i.imgur.com/PcTa3ep.png)

Contributing
------------

The project is very new but is already quite useful.  We always appreciate
feedback and value contributions.  The core developers are working hard towards
applying Bokeh and BokehJS towards some specific projects, so the dev priorities
will tend to center around those tasks, until the project reaches a point of
stability.  It should be considered alpha software at this point.

Please join the discussion on the [Bokeh mailing list](https://groups.google.com/a/continuum.io/forum/#!forum/bokeh).

