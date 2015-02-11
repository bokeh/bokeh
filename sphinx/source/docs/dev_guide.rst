.. _devguide:

Developer Guide
###############

.. contents::
    :local:
    :depth: 2

.. _developer_process:

Process
=======

The development process for Bokeh is outlined in `Bokeh Enhancement Proposal 1 <https://github.com/bokeh/bokeh/wiki/BEP-1:-Issues-and-PRs-management>`_. All changes, enhancements, and bugfixes should generally go
through the process outlined there.

The release process for Bokeh is outlined in `Bokeh Enhancement Proposal 2 <https://github.com/bokeh/bokeh/wiki/BEP-2:-Release-Management>`_.

.. _developer_install:

Installation for Developers
===========================

The Bokeh project encompasses two major components: the Bokeh package source code,
written in Python, and the BokehJS client-side library, written in CoffeeScript.
Accordingly, development of Bokeh is slightly complicated by the fact that
BokehJS requires an explicit compilation step to render the CoffeeScript source
into deployable JavaScript.

For this reason, in order to develop Bokeh from a source checkout,
you must first be able to build BokehJS.

.. _developer_building_bokehjs:

Building BokehJS
----------------

The BokehJS build process is handled by `Grunt <http://gruntjs.com/>`_,
which in turn depends on `Node.js <http://nodejs.org/>`_.
Grunt is used to compile CoffeeScript, Less and Eco sources, combine JavaScript resources,
and generate optimized and minified ``bokeh.js`` and ``bokeh.css`` files.


Install npm and node
~~~~~~~~~~~~~~~~~~~~

First, install Node.js and npm (node package manager).
You can download and install these directly, or use
`conda <http://conda.pydata.org/>`_ to install them
from the Bokeh channel on `Binstar <https://binstar.org>`_::

    $ conda install -c bokeh nodejs
    
Alternatively, on Ubuntu you can use ``apt-get``::
    
    $ apt-get install npm node


Install Grunt and necessary plugins
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Install grunt itself::

    $ npm install -g grunt-cli

Install the build dependencies
by running the following command in the ``bokehjs`` subdirectory::

    $ npm install

This command will install the necessary packages
in the ``node_modules`` subdirectory 
(and listed as ``devDependencies`` in ``package.json``).

At this point you can typically use the ``setup.py`` script at the top level directory
to manage building and installing BokehJS as part of the complete Bokeh library
(see :ref:`developer_python_setup`).

However, if you are using BokehJS as a standalone JavaScript library,
then the instructions below describe the process to iteratively
build BokehJS with Grunt for development purposes.

Building with Grunt
~~~~~~~~~~~~~~~~~~~

There are three main Grunt commands for development (to be executed from the 
``bokehjs`` subdirectory):

.. code-block:: sh

    $ grunt deploy

This will generate the compiled and optimized BokehJS libraries, and deploy
them to the ``build`` subdirectory.

.. code-block:: sh

    $ grunt build

This will build the BokehJS sources without concatenating and optimizing into
standalone libraries. At this point BokehJS can be be used together with ``require.js`` as an
`AMD module <http://requirejs.org/docs/whyamd.html>`_.

.. code-block:: sh

    $ grunt watch

This directs Grunt to automatically watch the source tree for changes and trigger a recompile
of individual files as they change—especially useful together with the ``--splitjs`` mode of
the Bokeh server to facilitate a more rapid development cycle.

Alternative BokehJS build system
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

As an alternative to Grunt, you can use `sbt <http://www.scala-sbt.org>`_ to
build BokehJS. To start, run

.. code-block:: sh

    $ ./sbt

in the top level directory. This will download ``sbt`` (and its dependencies) itself,
and configure the build system.

There are two main commands available: ``build`` and ``deploy``. The ``build`` command
compiles CoffeeScript, Less and Eco sources, and copies other resources to the
build directory. The ``deploy`` command does the same and additionally generates
optimized and minified ``bokeh.js`` and ``bokeh.css`` outputs.

You may also run specific subtasks, e.g. ``compile`` to compile CoffeeScript, Less and
Eco sources, but not copy resources. You can also prefix any command with ``~``, which
enables incremental compilation. For example, issuing ``~less`` will watch ``*.less``
sources and compile only the subset of files that changed. To stop watching sources,
press ENTER. Pressing Ctrl+C will terminate ``sbt``.

.. warning::
        The ``sbt`` build system is experimental and not integrated with ``setup.py``,
        so it should be used with caution.

.. _developer_python_setup:

Python Setup
------------

Once you have a working BokehJS build (which you can verify by completing the
steps described in :ref:`developer_building_bokehjs`), you can
use the ``setup.py`` script at the top level to install or develop the full
Bokeh library from source.

The ``setup.py`` script has two main modes of operation: ``install`` and
``develop``.

When ``python setup.py install`` is used, Bokeh will be installed in your local
``site-packages`` directory. In this mode, any changes to the python source
code will not show up until ``setup.py install`` is run again.

When ``python setup.py develop`` is used, a path file ``bokeh.pth``
will be written to your ``site-packages`` directory that points to the
``bokeh`` subdirectory of your source checkout. Any changes to the python
source code will be available immediately without any additional steps.

With either mode, you will be prompted for how to install BokehJS, e.g.::

    $ python setup.py install

    Bokeh includes a JavaScript library (BokehJS) that has its own
    build process. How would you like to handle BokehJS:

    1) build and install fresh BokehJS
    2) install last built BokehJS

    Choice?

You may skip this prompt by supplying the appropriate command line option
to ``setup.py``:

* ``--build_js``
* ``--install_js``

If you have any problems with the steps here, please contact the developers
(see :ref:`contact`).

Dependencies
~~~~~~~~~~~~
If you are working within a Conda environment, you will need to make sure you
have the python requirements installed. You can install these via ``conda
install`` or ``pip install`` for the packages referenced at
:ref:`install_dependencies`.

Testing dependencies include the following additional libraries:

* beautiful-soup
* colorama
* pdiff
* boto
* nose
* mock
* coverage
* websocket-client

Windows Notes
~~~~~~~~~~~~~
If you build bokeh on a Windows machine in a Conda environment with either
``setup.py install`` or ``setup.py develop``, running ``bokeh-server`` will
not work correctly. The .exe will not be available within the Conda
environment, which means you will use the version available in the base
install, if it is available. Instead, you can make sure you use the version
within the environment by explicitly running the bokeh-server python script
in the root of the bokeh repository, similar to the following example::

    python bokeh-server --script path\to\<yourapp>.py

"Developer" Mode Setup
----------------------
The processes described about result in building and using a full `bokeh.js`
library. This could be considered "production" mode. It is also possible to
run Bokeh code in a mode that utilizes ``require.js`` mode directly to serve
up individual JavaScript modules individually. If this is done, then changes
to BokehJS can be incrementally compiled, and the development iteration
cycle shortened considerably.

 development configuration (--splitjs, --dev, etc.)

.. _developer_documentation:

Documentation
=============

Requirements
------------

We use `Sphinx <http://sphinx-doc.org>` to generate our HTML documentation. You
will need the following packages installed in order to build Bokeh documentation:

* docutils
* sphinx
* sphinxcontrib-napoleon
* sphinxcontrib-httpdomain
* sphinx-bootstrap-theme
* seaborn
* pygments
* yaml
* pyyaml
* ggplot
* seaborn

These can be installed using ``conda`` or ``pip`` or from source. In
addition to the package requirements, you will also need to have the sample
data downloaded. See :ref:`install_sampledata` instructions on how to
download it.

Building
--------

To generate the full HTML documentation, navigate to the ``sphinx`` subdirectory
of the Bokeh source checkout, and execute the corresponding command::

    make all

or::

    make html

To start a server and automatically open the built documentation in a browser,
execute the command::

    make serve

Docstrings
----------

We use `Sphinx Napoleon <http://sphinxcontrib-napoleon.readthedocs.org/en/latest/index.html>`_
to process docstrings for our reference documentation. All docstrings are `Google Style Docstrings <http://sphinxcontrib-napoleon.readthedocs.org/en/latest/example_google.html#example-google>`_.

Docstrings should generally begin with a verb stating what the function or method does in
short statement. For example::

    """Create and return a new Foo."""

is to be preferred over::

    """This function creates and returns a new Foo."""

All docstrings for functions and methods should have an **Args:** section (if any
arguments are accepted) and also a **Returns:** section (even if the function just
returns None).

.. _developer_testing:

Testing
=======

There is a TravisCI project configured to execute on every GitHub push, it can
be viewed at: https://travis-ci.org/bokeh/bokeh.

To run the just the python unit tests, run the command::

    $ python -c "import bokeh; bokeh.test()"

To run just the BokehJS unit tests, execute::

    $ grunt test

in the `bokehjs` subdirectory.

Additionally, there are "examples tests" that check whether all the examples
produce outputs. This script is in the `examples` directory and can be run by
executing::

    $ test -D

You can run all available tests (python and JS unit tests and example tests)
from the top level directory by executing::

    $ BOKEH_DEFAULT_NO_DEV=True nosetests

Currently this script does not support Windows.

To help the test script choose the appropriate test runner, there are some
naming conventions that examples should adhere to. Non-IPython notebook
example scripts that rely on the Bokeh server should have 'server' or
'animate' in their filenames.

.. _bokehjs:

BokehJS
=======

BokehJS is the in-browser client-side runtime library that users of Bokeh
ultimately interact with.  This library is written primarily in CoffeeScript
and is one of the very unique things about the Bokeh plotting system.

.. _bokehjs_motivations:

BokehJS Motivations
-------------------

When researching the wide field of JavaScript plotting libraries, we found
that they were all architected and designed to integrate with other JavaScript.
If they provided any server-side wrappers, those were always "second class" and
primarily designed to generate a simple configuration for the front-end JS.  Of
the few JS plotting libraries that offered any level of interactivity, the
interaction was not really configurable or customizable from outside the JS
itself. Very few JS plotting libraries took large and streaming server-side
data into account, and providing seamless access to those facilities from
another language like Python was not a consideration.

This, in turn, has caused the developers of Python plotting libraries to
only treat the browser as a "backend target" environment, for which they
will generate static images or a bunch of JavaScript.

.. _bokehjs_goals:

Goals
-----

BokehJS is intended to be a standalone, first-class JavaScript plotting
library and *interaction runtime* for dynamic, highly-customizable
information visualization.  Currently we use HTML5 Canvas, and in the
future this may be extended to include WebGL.  We are keeping a very
close watch over high-performance JavaScript technologies, including
web workers, asm.js, SIMD, and parallel JS (e.g. River Trail).

.. _bokehjs_interface:

Interface
---------

BokehJS is a standalone JavaScript library for dynamic and interactive visualization
in the browser. It is built on top of HTML5 canvas, and designed for high-performance
rendering of larger data sets. Its interface is declarative, in the style of
`Protovis <http://mbostock.github.io/protovis/>`_, but its implementation consists of
a reactive scene graph (similar to `Chaco <http://code.enthought.com/chaco/>`_). Some
examples for different types of plots are show below in `bokehjs_examples`_.

The full BokehJS interface is described detail in :doc:`reference/bokehjs`

.. _bokehjs_dependencies:

Dependencies
------------
BokehJS ships with all of its vendor dependencies built in. For reference, the vendor libraries that BokehJS includes are:

* almond
* backbone-amd
* bootstrap-3.1.1
* font-awesome-4.2.0
* gear-utils
* hammer.js-2.0.4
* jqrangeslider-5.7.0
* jquery-1.11.1
* jquery-event-2.2
* jquery-mousewheel-3.1.12
* jquery-ui-1.11.2
* jsnlog.js-2.7.5
* kiwi
* numeral.js-1.5.3
* qunit
* rbush
* requirejs
* slick-grid-2.1.0
* sprintf
* text
* timezone
* underscore-amd


.. _bokehjs_examples:

Examples
--------

Several live examples that demonstrate the BokehJS interface are available as JSFiddles.
Click on "CoffeeScript" to see the code that generates these plots, or on "Edit in
JSFiddle" to fork and create your own examples.

Scatter
~~~~~~~

This example shows a scatter plot where every circle has its own radius and color.

.. raw:: html

    <iframe width="100%" height="700" src="http://jsfiddle.net/bokeh/Tw5Sm/embedded/result,js/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

Lorenz
~~~~~~

This example shows a 2D projection of the Lorenz attractor. Sections of the line are color-coded
by time.

.. raw:: html

    <iframe width="100%" height="700" src="http://jsfiddle.net/bokeh/s2k59/embedded/result,js" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

Animated
~~~~~~~~

This example shows how it it possible to animate BokehJS plots by updating the data source.

.. raw:: html

    <iframe width="100%" height="700" src="http://jsfiddle.net/bokeh/K8P4P/embedded/result,js/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


.. _pythoninterface:

Python Interface
================

Low-level Object Interface
--------------------------

Here is a notional diagram showing the overall object system in Bokeh. We will discuss each
of these in turn.

.. image:: /_images/objects.png
    :align: center

Models and properties
---------------------

The primary components of the low-level API are models, which are objects
that have attributes that can be automatically serialized in a way that
lets them be reconstituted as Backbone objects within BokehJS. Technically,
models are classes that inherit from `HasProps` at some point::

    from bokeh.properties import HasProps, Int

    class Whatever(HasProps):
        """ `Whatever` model. """

Models can derive from other models as well as mixins that provide common
sets of properties (e.g. see :class:`~bokeh.mixins.LineProps`, etc. in :ref:`bokeh_dot_mixins`).
An example might look like this::

    class Another(Whatever, LineProps):
        """ `Another` model. """

Models contain properties, which are class attributes of type
:class:`~bokeh.properties.Property`, e.g::

    class IntProps(HasFields):

        prop1 = Int
        prop2 = Int()
        prop3 = Int(10)

The `IntProps` model represents objects that have three integer values,
``prop1``, ``prop2``, and ``prop3``, that can be automatically serialized
from python, and unserialized by BokehJS.

.. note::
    Technically, ``prop1`` isn't an instance of ``Int``, but ``HasFields`` uses a
    metaclass that automatically instantiates `Property` classes when necessary,
    so ``prop1`` and ``prop2`` are equivalent (though independent) properties.
    This is useful for readability; if you don't need to pass any arguments to
    property's constructor then prefer the former over the later.

There is wide variety of property types, ranging from primitive types such as:

* :class:`~bokeh.properties.Byte`
* :class:`~bokeh.properties.Int`
* :class:`~bokeh.properties.Float`
* :class:`~bokeh.properties.Complex`
* :class:`~bokeh.properties.String`

As well as container-like properties, that take other Properties as parameters:

* :class:`~bokeh.properties.List` --- for a list of one type of objects: ``List(Int)``
* :class:`~bokeh.properties.Dict` --- for a mapping between two type: ``Dict(String, Double)``

and finally some specialized types like

* :class:`~bokeh.properties.Instance` --- to hold a reference to another model: ``Instance(Plot)``
* :class:`~bokeh.properties.Enum` --- to represent enumerated values: ``Enum("foo", "bar", "baz")``
* :class:`~bokeh.properties.Either` --- to create a union type: ``Either(Int, String)``
* :class:`~bokeh.properties.Range` --- to restrict values to a given range: ``Instance(Plot)``

The primary benefit of these property types is that validation can be performed
and meaningful error reporting can occur when an attempt is made to assign an
invalid type or value.

.. warning::
    There is an :class:`~bokeh.properties.Any` that is the super-type of all other
    types, and will accept any type of value. Since this circumvents all type validation,
    make sure to use it sparingly, it at all.

See :ref:`bokeh_dot_properties` for full details.

An example of a more complex, realistic model might look like this::

    class Sample(HasProps, FillProps):
        """ `Sample` model. """

        prop1 = Int(127)
        prop2 = Either(Int, List(Int), Dict(String, List(Int)))
        prop3 = Enum("x", "y", "z")
        prop4 = Range(Float, 0.0, 1.0)
        prop5 = List(Instance(Range1d))

There is a special property-like type named :class:`~bokeh.properties.Include`,
that make it simpler to mix in in properties from a mixin using a prefix, e.g.::

    class Includes(HasProps):
        """ `Includes` model. """

        some_props = Include(FillProps)

In this case there is a placeholder property `some_props`, that will be removed
and automatically replaced with all the properties from :class:`~bokeh.mixins.FillProps`,
each with `some_` appended as a prefix.

.. note::
    The prefix can be a valid identifier. If it ends with ``_props`` then ``props``
    will be removed. Adding ``_props`` isn't necessary, but can be useful if a
    property ``some`` already exists in parallel (see ``Plot.title`` as an example).

Using :class:`~bokeh.properties.Include` is equivalent to writing::

    class ExplicitIncludes(HasProps):
        """ `ExplicitIncludes` model. """

        some_fill_color = ColorSpec(default="gray")
        some_fill_alpha = DataSpec(default=1.0)

Note that you could inherit from :class:`~bokeh.mixins.FillProps` in this
case, as well::

    class IncludesExtends(HasProps, FillProps):
        """ `IncludesExtends` model. """

        some = String
        some_props = Include(FillProps)

but note that this is  equivalent to::

    class ExplicitIncludesExtends(HasProps):
        """ `ExplicitIncludesExtends` model. """

        fill_color = ColorSpec(default="gray")
        fill_alpha = DataSpec(default=1.0)
        some = String
        some_fill_color = ColorSpec(default="gray")
        some_fill_alpha = DataSpec(default=1.0)

Developer Notes
===============

Environment Variables
---------------------
There are several environment variables that can be useful for developers:

* ``BOKEH_BROWSER`` --- What browser to use when opening plots
    Valid values are any of the browser names understood by the python standard
    library `webbrowser module <https://docs.python.org/2/library/webbrowser.html>`_.

* ``BOKEH_LOG_LEVEL`` --- The BokehJS console logging level to set
    Valid values are, in order of increasing severity:

  - ``trace``
  - ``debug``
  - ``info``
  - ``warn``
  - ``error``
  - ``fatal``

    The default logging level is ``info``.

    .. note::
        When running  server examples, it is the value of this ``BOKEH_LOG_LEVEL`` that is
        set for the server that matters.

* ``BOKEH_MINIFIED`` --- Whether to emit minified JavaScript for ``bokeh.js``
    Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.

* ``BOKEH_PRETTY`` --- Whether to emit "pretty printed" JSON
    Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.

* ``BOKEH_PY_LOG_LEVEL`` --- The Python logging level to set
    As in the JS side, valid values are, in order of increasing severity:

  - ``debug``
  - ``info``
  - ``warn``
  - ``error``
  - ``fatal``

    The default logging level is ``info``.

* ``BOKEH_RESOURCES`` --- What kind of BokehJS resources to configure
    For example:  ``inline``, ``cdn``, ``server``. See the :class:`~bokeh.resources.Resources`
    class reference for full details.

* ``BOKEH_ROOTDIR`` --- Root directory to use with ``relative`` resources
    See the :class:`~bokeh.resources.Resources` class reference for full details.

* ``BOKEH_SIMPLE_IDS`` --- Whether to generate human-friendly object IDs
    Accepted values are ``yes``/``no``, ``true``/``false`` or ``0``/``1``.
    Normally Bokeh generates UUIDs for object identifiers. Setting this variable
    to an affirmative value will result in more friendly simple numeric IDs
    counting up from 1000.

* ``BOKEH_VERSION`` --- What version of BokehJS to use with ``cdn`` resources
    See the :class:`~bokeh.resources.Resources` class reference for full details.

The next four environment variable are related to the IPython/Jupyter notebook:

* ``BOKEH_NOTEBOOK_RESOURCES`` --- How and where to load BokehJS from

* ``BOKEH_NOTEBOOK_VERBOSE`` --- Whether to report detailed settings, defaults to False

* ``BOKEH_NOTEBOOK_HIDE_BANNER`` --- Whether to hide the Bokeh banner, defaults to False

* ``BOKEH_NOTEBOOK_SKIP_LOAD`` --- Whether to skip ``load_notebook`` at Bokeh initialization


CSS class names
---------------
The CSS for controlling Bokeh presentation are located in a ``bokeh.css`` file
that is compiled from several separate ``.less`` files in the BokehJS source
tree. All CSS classes specifically for Bokeh DOM elements are prefixed with
the string ``bk-``. For instance some examples are: ``.bk-sidebar``, ``.bk-toolbar-button``, etc.

Furthermore, BokehJS ships with its own version of `Bootstrap <http://getbootstrap.com>`_.
To prevent name collisions, the version of Bootstrap CSS that Bokeh uses has
been entirely prefixed with the prefix ``bk-bs-``.

Managing examples
-----------------

 examples' naming convention (e.g. _server suffix)
 adding examples to test.yml

Choosing right types
--------------------

 choosing correct types for properties (don't use Any if possible)

Managing Python modules
-----------------------

 update packages in setup.py when changing module structure

Managing external JS libraries
------------------------------

 adding packages to and updating bokehjs/src/vendor

Maintaining secure variables in .travis.yml
-------------------------------------------

 interactions with travis-ci from CLI (gem install --user-instal travis)
 how to update secure values in .travis.yml (S3, flowdock)

Browser caching
---------------

During development, depending on the type of configured resources,
aggressive browser caching can sometimes cause new BokehJS code changes to
not be picked up. It is recommended that during normal development,
browser caching be disabled. Instructions for different browsers can be
found here:

* `Chrome <https://developer.chrome.com/devtools/docs/settings>`__
* `Firefox <https://developer.mozilla.org/en-US/docs/Mozilla/Preferences/Mozilla_networking_preferences#Cache>`__
* `Safari <https://developer.apple.com/library/mac/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/TheDevelopMenu/TheDevelopMenu.html>`_
* `Internet Explorer <http://msdn.microsoft.com/en-us/library/hh968260(v=vs.85).aspx#cacheMenu>`__

Additionlly some browsers also provide a "private mode" that may disable
caching automatically.

Even with caching disabled, on some browsers, it may still be required to
sometimes force a page reload. Keyboard shortcuts for forcing page
refreshes can be found here:

* Chrome `Windows <https://support.google.com/chrome/answer/157179?hl=en&ref_topic=25799>`__ / `OSX <https://support.google.com/chrome/answer/165450?hl=en&ref_topic=25799>`__ / `Linux <https://support.google.com/chrome/answer/171571?hl=en&ref_topic=25799>`__
* `Firefox <https://support.mozilla.org/en-US/kb/keyboard-shortcuts-perform-firefox-tasks-quickly#w_navigation>`__
* `Safari <https://developer.apple.com/library/mac/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/KeyboardShortcuts/KeyboardShortcuts.html>`__
* Internet Explorer `10 <http://msdn.microsoft.com/en-us/library/dd565630(v=vs.85).aspx>`__ / `11 <http://msdn.microsoft.com/en-us/library/ie/dn322041(v=vs.85).aspx>`__

If it appears that new changes are not being executed when they should be, it
is recommended to try this first.

BokehJS AMD module template for a model
---------------------------------------

Supposed you want to add a model for a `Button` widget. This must be accompanied
by a collection and (most often) a view. Follow this steps:

#. There is one model per source file policy. The file name is the snakified version
   of the model name. In this case `button.coffee`.
#. Choose location of the source file under `bokehjs/src/coffee`. This depends on
   the role of your model. Button is a widget, so it goes into `widget`. If you
   create a group of related models, then you may consider adding a subdirectory
   that will contain those models. Do not add top-level directories unless you
   add a completely new kind of functionality to bokeh.
#. Update `bokehjs/src/coffee/common/base.coffee`. This is required for model loader
   to be able to resolve your new model. Two additions are necessary. First, add
   module path to `define [...]`. Then update `locations: ...` mapping with
   model name and module path entry. Module path is source file path relative
   to `bokehjs/src/coffee` directory and without extension. In this case it's
   `widget/button`, so you add `widget/button` to `define [...]` and `Button:
   `widget/button` to `locations: ...`. Make sure to add them under appropriate
   sections, preferably in lexicographic order or group by functionality.
#. Create the source file using the following template::

    define [
      "underscore"
      "backbone"
      "common/continuum_view"
      "common/has_parent"
      "common/logging"
      "./button_template"
    ], (_, Backbone, continuum_view, HasParent, Logging, template) ->

      logger = Logging.logger

      class ButtonView extends continuum_view.View
        tagName: "div"
        template: template
        events:
          "click": "on_click"

        on_click: () ->
          logger.info("click!")

        initialize: (options) ->
          super(options)
          @render()
          @listenTo(@model, 'change', @render)

        render: () ->
          @$el.empty()
          html = @template(@model.attributes)
          @$el.html(html)
          return this

      class Button extends HasParent
        type: "Button"
        default_view: ButtonView

        defaults: () ->
          _.extend({}, super(), {
            text: 'Button'
          }

      class Buttons extends Backbone.Collection
        model: Button

      return {
        Model: Button
        Collection: new Buttons()
        View: ButtonView
      }

   Note that this is just a template, so make sure you change it accordingly to your
   application. However, most implementation will have to have three classes defined:
   a model, a collection and a view, which must directly or indirectly inherit from
   `HasProperties`, `Backbone.Collection` and `continuum_view.View` respectively. In
   this case you can see that the model inherits from `HasParent` which in turn
   inherits from `HasProperties`. If a view is defined, the model must have `default_view`
   defined. You are not forced to use ECO templates for rendering of a view, but it's
   encouraged, because it takes care of variable encoding, so it's less likely to
   introduce XSS vulnerabilities this way. Otherwise, take advantage of jQuery's APIs,
   like `$(...).text("foobar")`. Do *not* use plain string concatenation or interpolation,
   because you will quickly compromise security this way.

#. Test your new module in development and production modes (i.e. with `require()` and
   `r.js`). Your module can work perfectly in one mode and not load at all in the other,
   so keep that in mind.
