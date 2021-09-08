.. _contributor_guide_bokehjs:

Contributing to BokehJS
=======================

BokehJS is the in-browser client-side runtime library that users of Bokeh
ultimately interact with. This library is written primarily in TypeScript
and is one of the unique things about the Bokeh plotting system.

.. _contributor_guide_bokehjs_motivations:

BokehJS Motivations
-------------------

When researching the wide field of JavaScript plotting libraries, we found
that they were all architected and designed to integrate with other JavaScript.
If they provided any server-side wrappers, those were always "second class"
and primarily designed to generate a simple configuration for the front-end JS.
Of the few JS plotting libraries that offered any level of interactivity, the
interaction was not really configurable or customizable from outside the JS
itself. Very few JS plotting libraries took large and streaming server-side
data into account, and providing seamless access to those facilities from
another language like Python was not a consideration.

This, in turn, has caused the developers of Python plotting libraries to
only treat the browser as a "backend target" environment, for which they
will generate static images or a bunch of JavaScript.

.. _contributor_guide_bokehjs_goals:

Goals
-----

BokehJS is intended to be a standalone, first-class JavaScript plotting
library and *interaction runtime* for dynamic, highly-customizable
information visualization.

.. _contributor_guide_bokehjs_interface:

Interface
---------

BokehJS is a standalone JavaScript library for dynamic and interactive
visualization in the browser. It is built on top of HTML5 canvas, and designed
for high-performance rendering of larger data sets. Its interface is declarative,
in the style of Protovis_, but its implementation consists of a reactive scene
graph (similar to Chaco_).

More information is available at :ref:`userguide_bokehjs`.

CSS Class Names
---------------

The CSS for controlling Bokeh presentation are located in a ``bokeh.css`` file
that is compiled from several separate ``.less`` files in the BokehJS source
tree. All CSS classes specifically for Bokeh DOM elements are prefixed with
the string ``bk-``. For instance some examples are: ``.bk-plot``, ``.bk-toolbar-button``, etc.

.. _contributor_guide_bokehjs_development:

Development
-----------

BokehJS's source code is located in the :bokeh-tree:`bokehjs` directory in Bokeh's
monorepo repository. All further instructions and shell commands assume that
``bokehjs/`` is the current directory.

Some guidelines to adhere to when working on BokehJS:

* Do not use ``for-in`` loops, especially unguarded by ``hasOwnProperty()`` Use
  ``for-of`` loop in combination with ``keys()``, ``values()`` and/or
  ``entries()`` from the ``core/util/object`` module instead.

Requirements
~~~~~~~~~~~~

* node 14+
* npm 7.4+ (most recent version)
* chrome/chromium browser 90+ or equivalent

You can install nodejs with conda:

.. code-block:: sh

    $ conda install -c conda-forge nodejs

or follow the official installation `instructions <https://nodejs.org/en/download/>`_.

Upgrade your npm after installing or updating nodejs, or whenever asked by npm:

.. code-block:: sh

    $ npm install -g npm@7

Officially supported platforms are as follows:

* Linux Ubuntu 20.04+ or equivalent
* Windows 10 (or Server 2019)
* MacOS 10.15

BokehJS can be developed on different platforms and versions of aforementioned
software, but results may vary, especially when it comes to testing (visual
testing in particular).

Building
~~~~~~~~

BokehJS's build is maintained by using an in-house tool that visually resembles
gulp. All commands start with ``node make`` (don't confuse this with GNU make).

Most common commands:

* ``node make build``
* ``node make test``
* ``node make lint``

Use ``node make help`` to list all available commands.

``node make`` automatically runs ``npm install`` whenever ``package.json`` changes.

You can use ``tsc`` directly for error checking (e.g. in an IDE). However, don't use
it for code emit, because we rely on AST transforms to produce viable library code.

Testing
~~~~~~~

The Bokeh repository contains several test suites. These tests help to make sure
that BokehJS functions consistently as its own library as well as in combination
with all other components of Bokeh.

To learn more about running tests for BokehJS locally, see
:ref:`contributor_guide_testing_local_javascript`.

To learn more about adding and updating tests for BokehJS, see
:ref:`contributor_guide_writing_tests_bokehjs`.

Debugging in Headless Chrome
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Although testing in headless Chrome and running tests manually in Chrome should agree
with each other most of the time, there are rare cases where headless and GUI Chrome
diverge. In this situation one has to debug BokehJS' code directly in the headless
browser.

Start BokehJS' devtools server in one console and run ``node make test:run:headless``
in another. This starts Chrome in headless mode preconfigured for bokehjs' testing
setup. Then open Chrome (or any other web browser), navigate to http://localhost:9222 and
click ``about:blank`` link. This opens remote devtools console. Use its navigation bar
and navigate to e.g. http://localhost:5777/integration/run (or other URL mentioned in
an earlier paragraph). You are now set up for debugging in headless Chrome.

Minimal Model/View Module
~~~~~~~~~~~~~~~~~~~~~~~~~

Models (and views) come in many forms and sizes. At minimum, a model is implemented.
A view may follow if a "visual" model is being implemented. A minimal model/view
module looks like this:

.. code-block:: typescript

    import {BaseModel, BaseModelView} from "models/..."

    export class SomeModelView extends BaseModelView {
      model: SomeModel

      initialize(): void {
        super.initialize()
        // perform view initialization (remove if not needed)
      }

      async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        // perform view lazy initialization (remove if not needed)
      }
    }

    export namespace SomeModel {
      export type Attrs = p.AttrsOf<Props>

      export type Props = BaseModel.Props & {
        some_property: p.Property<number>
        // add more property declarations
      }
    }

    export interface SomeModel extends SomeModel.Attrs {}

    export class SomeModel extends BaseModel {
      properties: SomeModel.Props
      __view_type__: SomeModelView

      // do not remove this constructor, or you won't be
      // able to use `new SomeModel({some_property: 1})`
      constructor(attrs?: Partial<SomeModel.Attrs>) {
        super(attrs)
      }

      static {
        this.prototype.default_view = SomeModelView

        this.define<SomeModel.Props>(({Number}) => ({
          some_property: [ Number, 0 ],
          // add more property definitions
        }))
      }
    }

For trivial modules like this, most of the code is just boilerplate to make
BokehJS's code statically type-check and generate useful type declarations
for further consumption (in tests or by users).

Code Style Guide
~~~~~~~~~~~~~~~~

BokehJS doesn't have an explicit style guide. Make your changes consistent in
formatting. Use ``node make lint``. Follow patterns observed in the surrounding
code and apply common sense.

.. _Chaco: https://github.com/enthought/chaco
.. _JSFiddle: http://jsfiddle.net/
.. _Protovis: http://mbostock.github.io/protovis/
.. _GitHub_Actions: https://github.com/bokeh/bokeh/actions?query=workflow%3ABokehJS-CI
