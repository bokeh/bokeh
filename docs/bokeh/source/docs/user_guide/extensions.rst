.. _userguide_extensions:

Extending Bokeh
===============

Bokeh comes with a rich variety of built-in features that let you produce
sophisticated interactive visualizations and data applications in the browser.
However, some useful capabilities and features may not make it into the core
library, either because they are too specialized or for lack of resources.
Fortunately, you can expand the functionality of Bokeh with custom extensions
that let you:

* Modify the behavior of existing Bokeh models
* Add new models to connect third-party JavaScript libraries to Python
* Create highly specialized models for domain-specific use cases

You can make and use custom extensions with standard releases and don't need to
set up a development environment or build anything from source. This is the
easiest way to get involved in Bokeh development. You can try new features and
improved functionality without having to wait for the core team to implement
them into Bokeh itself.

.. note::
   Extending Bokeh is an advanced feature. Some aspects of creating and using
   extensions are still under active development and should be considered
   experimental.

.. _userguide_extensions_structure:

Structure of Bokeh models
-------------------------

.. _userguide_extensions_structure_python:

Python models
~~~~~~~~~~~~~

For the most part, Python Bokeh models are completely declarative classes.
You can create custom extensions by making a subclass from |Model| and including
special class attributes to declare the properties to be mirrored on the
JavaScript side. For all of the available property types, see the
:ref:`bokeh.core.properties` section of the |reference guide|.

Here's a simple example that creates a custom readout for a slider:

.. code-block:: python

    from bokeh.core.properties import String, Instance
    from bokeh.models import HTMLBox, Slider

    class Custom(HTMLBox):

        text = String(default="Custom text")

        slider = Instance(Slider)

This example creates a subclass from :class:`~bokeh.models.layouts.HTMLBox` to
allow the extension to integrate into the DOM layout. It also adds two
properties:

* a :class:`~bokeh.core.properties.String` to configure a text message for the
  readout and
* an :class:`~bokeh.core.properties.Instance` that can hold a
  :class:`~bokeh.models.widgets.inputs.Slider`.

This creates a JavaScript ``Slider`` object that corresponds to a ``Slider`` in
Python.

.. _userguide_extensions_structure_js:

JavaScript models and views
~~~~~~~~~~~~~~~~~~~~~~~~~~~

While the Python side has little to no code, the JavaScript side requires code
to implement the model. You also have to provide code for a corresponding view
where necessary.

Here's an annotated TypeScript implementation for ``Custom`` and its
``CustomView``. For built-in models, this type of code is included directly in
the final BokehJS scripts.

.. code-block:: typescript

    import {HTMLBox, HTMLBoxView} from "models/layouts/html_box"

    import {div} from "core/dom"
    import * as p from "core/properties"

    export class CustomView extends HTMLBoxView {

      connect_signals(): void {
        super.connect_signals()

        // Set BokehJS listener so that the program can process new data when
        // the slider has a change event.
        this.connect(this.model.slider.change, () => {
          this.render()
          this.invalidate_layout()
        })
      }

      render(): void {
        // BokehJS views create <div> elements by default. These are accessible
        // as ``this.el``. Many Bokeh views ignore the default <div> and
        // instead do things like draw to the HTML canvas. In this case though,
        // the program changes the contents of the <div> based on the current
        // slider value.
        super.render()

        this.shadow_el.appendChild(div({
          style: {
            padding: '2px',
            color: '#b88d8e',
            backgroundColor: '#2a3153',
          },
        }, `${this.model.text}: ${this.model.slider.value}`))
      }
    }

    export class Custom extends HTMLBox {
      slider: {value: string}

      // Generally, the ``__name__`` class attribute should match the name of
      // the corresponding Python class exactly. TypeScript matches the name
      // automatically during compilation, so, barring some special cases, you
      // don't have to do this manually. This helps avoid typos, which stop
      // serialization/deserialization of the model.
      static __name__ = "Surface3d"

      static {
        // If there is an associated view, this is typically boilerplate.
        this.prototype.default_view = CustomView

        // The this.define() block adds corresponding "properties" to the JS
        // model. These should normally line up 1-1 with the Python model
        // class. Most property types have counterparts. For example,
        // bokeh.core.properties.String will correspond to ``String`` in the
        // JS implementation. Where JS lacks a given type, you can use
        // ``p.Any`` as a "wildcard" property type.
        this.define<Custom.Props>(({String, Ref}) => ({
          text:   [ String ],
          slider: [ Ref(Slider) ],
        }))
      }
    }

.. _userguide_extensions_structure_putting_together:

Putting it together
~~~~~~~~~~~~~~~~~~~

For built-in Bokeh models, the building process automatically matches the
implementation in BokehJS with the corresponding Python model. The Python class
should also have a class attribute called ``__implementation__`` with the value
of the JavaScript (or TypeScript) code that defines the client-side model as
well as any optional views.

Assuming you save the TypeScript code from the previous example in a file
called ``custom.ts``, the complete Python class might look like this:

.. code-block:: python

    from bokeh.core.properties import String, Instance
    from bokeh.models import HTMLBox, Slider

    class Custom(HTMLBox):

        __implementation__ = "custom.ts"

        text = String(default="Custom text")

        slider = Instance(Slider)

Assuming that a Python module ``custom.py`` defines this class, you can now use
the custom extension exactly you would any built-in Bokeh model.

.. code-block:: python

    from bokeh.io import show, output_file
    from bokeh.layouts import column
    from bokeh.models import Slider

    slider = Slider(start=0, end=10, step=0.1, value=0, title="value")

    custom = Custom(text="Special Slider Display", slider=slider)

    layout = column(slider, custom)

    show(layout)

This produces the following output:

.. bokeh-plot:: docs/user_guide/examples/extensions_putting_together_ts.py
    :source-position: none

The rendered document automatically includes the JavaScript code for the
implementation. Move the slider to see the special header update as the
slider moves.

.. _userguide_extensions_specifying_implementation_languages:

Specifying implementation languages
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If the value of ``__implementation__`` is a single line that ends in either
``.js`` or ``.ts``, Bokeh interprets it as a filename, opens the file, and
compiles its contents according to the file's extension.

In case of an incline implementation, specify the language for the source
code by using the classes ``JavaScript`` or ``TypeScript``. Here's an
example:

.. code-block:: python

    class Custom(Model):

        __implementation__ = JavaScript(" <JS code here> ")

.. _userguide_extensions_specifying_default_values:

Specifying default values
~~~~~~~~~~~~~~~~~~~~~~~~~

If your properties have default values, you must provide the default value on
both the Python side and on the JavaScript side. The values you provide should
be the same on both sides. For efficiency reasons, Bokeh only transmits property
values that a user has explicitly changed from their default values.

As a concrete example, a boolean property ``flag`` with a default value of True
should look like this on the Python side:

.. code-block:: python

    flag = Bool(default=True)

And it should look like this on the Bokeh side:

.. code-block:: typescript

    flag: [ Boolean, true ]

.. _userguide_extensions_supplying_external_resources:

Supplying external resources
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You may require third-party JavaScript libraries or CSS resources to implement
a custom model in Bokeh. You can supply external resources through the
``__javascript__`` and ``__css__`` Python class attributes of custom models.

Including URL paths to external resources adds them to the HTML document head,
making JavaScript libraries available in the global namespace and applying
custom CSS styling.

Here's an example that includes JS and CSS files for `KaTeX`_ (a JS library
with LaTeX support) in order to create a ``LatexLabel`` custom model.

.. code-block:: python

    class LatexLabel(Label):
        """A subclass of the built-in Bokeh model `Label` that supports
        rendering LaTeX with the KaTeX typesetting library.
        """
        __javascript__ = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.js"
        __css__ = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css"
        __implementation__ = """
        # do something here
        """

For a complete implementation and its output, see the LaTeX example in the
extension gallery below.

.. _userguide_extensions_structure_server_integration:

Integration with Bokeh server
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You don't have to do any extra work to integrate custom extensions with the
Bokeh server. As for standalone documents, the rendered application
automatically includes the JavaScript implementation. Additionally, the
standard synchronization of Bokeh model properties is transparent for custom
user extensions, same as for built-in models.

.. _userguide_extensions_examples:

Examples
--------

This section aims to provide you with basic examples to help you start creating
custom extensions. This is a somewhat advanced topic, however, and you will
often have to study the source code of the base classes in
:bokeh-tree:`bokehjs/src/lib/models` to make progress.

.. toctree::

    extensions_gallery/ticking
    extensions_gallery/tool
    extensions_gallery/wrapping
    extensions_gallery/widget

:ref:`userguide_extensions_examples_ticking`
    Subclass a built-in Bokeh model for axis ticking to customize axis tick
    behavior.

:ref:`userguide_extensions_examples_tool`
    Make a completely new tool that can draw on a plot canvas.

:ref:`userguide_extensions_examples_wrapping`
    Connect Python to a third-party JavaScript library by wrapping it in
    a Bokeh custom extension.

:ref:`userguide_extensions_examples_widget`
    Include a third-party JavaScript library in an extension widget.

.. _KaTeX: https://khan.github.io/KaTeX/
.. _TypeScript: https://www.typescriptlang.org/

.. _userguide_extensions_prebuilt:

Pre-built extensions
--------------------

So far, this chapter covered simple, typically inline extensions. These are
great for ad hoc additions to Bokeh, but this approach is not particularly
convenient when it comes to serious development.

For example, the implicit nature of certain configuration files such as
``package.json`` or ``tsconfig.json`` doesn't allow you to take full advantage
of your IDE's capabilities when writing TypeScript or JavaScript for an
extension.

Enter pre-built extensions.

To create a pre-built extension, use the ``bokeh init`` command. This creates
all the necessary files, including ``bokeh.ext.json``, ``package.json``,
and ``tsconfig.json``.

To create and customize an extension step by step, run
``bokeh init --interactive``.

To build your extension, use the ``bokeh build`` command. This runs
``npm install``, if necessary, compiles TypeScript files, transpiles JavaScript
files, resolves modules, and links them together in distributable bundles.

Bokeh caches compilation products to improve performance. If this causes
issues, rebuild your extension from scratch with the ``bokeh build --rebuild``
command.
