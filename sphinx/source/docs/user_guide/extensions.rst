.. _userguide_extensions:

Extending Bokeh
===============

Bokeh comes with a rich variety of built-in types that can be used to make
sophisticated interactive visualizations and data applications in the browser.
However, there are capabilities and features that users may desire, which may
not make it into the core library, either because they are too specialized, or
for lack of resources. Fortunately, it is possible to extend Bokeh by creating
custom user extensions.

* Modify the behavior of existing Bokeh models
* Add new models to connect third-party JavaScript libraries to Python
* Create highly specialized models for domain specific use-cases.

Custom extensions can be made and used with standard releases, and do not
require setting up a development environment or building anything from source.
They provide the easiest way to get involved in Bokeh development. By lowering
the bar for extending Bokeh, users are afforded the ability to "try out" new
features and functionality (which might some day be candidates for adding to
the core library) without having to wait on the core team.

.. _userguide_extensions_structure:

Structure of Bokeh Models
-------------------------

.. _userguide_extensions_structure_python:

Python Models
~~~~~~~~~~~~~

For the most part, Python Bokeh models are completely declarative classes.
Custom extensions are created by making a subclass :class:`~bokeh.model.Model`
(or one of its subclasses), and including special class attributes to
declare the properties that are mirrored on the JavaScript side. All of the
available property types are documented in the :ref:`bokeh.core.properties`
section of the Reference Guide.

A small example that creates a Custom readout for a slider is presented
below:

.. code-block:: python

    from bokeh.core.properties import String, Instance
    from bokeh.models import LayoutDOM, Slider

    class Custom(LayoutDOM):

        text = String(default="Custom text")

        slider = Instance(Slider)

Since we would like to create a custom extension that can participate in DOM
layout, we subclass from :class:`~bokeh.models.layouts.LayoutDOM`. We also
added two properties: a :class:`~bokeh.core.properties.String` to configure
a text message for the readout, and an :class:`~bokeh.core.properties.Instance`
that can hold a :class:`~bokeh.models.widgets.inputs.Slider`. The JavaScript
``Slider`` object that corresponds to the Python ``Slider`` will be made
available to use.

.. _userguide_extensions_structure_js:

JavaScript Models and Views
~~~~~~~~~~~~~~~~~~~~~~~~~~~

While the Python side is mostly declarative, without much or any real code, the
JavaScript side requires code to implement the model. When appropriate, code
for a corresponding view must also be provided.

Below is an annotated TypeScript implementation for ``Custom`` and its
``CustomView``. For built-in models, this code is included directly in the
final BokehJS scripts. We will see how to connect this code to custom
extensions in the next section.

.. note::
    BokehJS was originally written in `CoffeeScript`_, but is being ported
    to `TypeScript`_. Accordingly, the guidance here is presented in TypeScript.
    However, custom extensions can be written in CoffeeScript or pure JavaScript
    as well.

.. code-block:: typescript

    import {div, empty} from "core/dom"
    import * as p from "core/properties"
    import {LayoutDOM, LayoutDOMView} from "models/layouts/layout_dom"

    export class CustomView extends LayoutDOMView {

      initialize(options) {
        super.initialize(options)

        this.render()

        // Set BokehJS listener so that when the Bokeh slider has a change
        // event, we can process the new data
        this.connect(this.model.slider.change, () => this.render())
      }

      render() {
        // BokehjS Views create <div> elements by default, accessible as
        // ``this.el``. Many Bokeh views ignore this default <div>, and instead
        // do things like draw to the HTML canvas. In this case though, we change
        // the contents of the <div>, based on the current slider value.
        empty(this.el)
        this.el.appendChild(div({
          style: {
            'padding': '2px',
            'color': '#b88d8e',
            'background-color': '#2a3153',
          },
        }, `${this.model.text}: ${this.model.slider.value}`))
      }
    }

    export class Custom extends LayoutDOM {

      // If there is an associated view, this is typically boilerplate.
      default_view = CustomView

      // The ``type`` class attribute should generally match exactly the name
      // of the corresponding Python class.
      type = "Custom"
    }

    // The @define block adds corresponding "properties" to the JS model. These
    // should normally line up 1-1 with the Python model class. Most property
    // types have counterparts, e.g. bokeh.core.properties.String will be
    // ``p.String`` in the JS implementation. Any time the JS type system is not
    // yet as complete, you can use ``p.Any`` as a "wildcard" property type.
    Custom.define({
      text:   [ p.String ],
      slider: [ p.Any    ],
    })

.. _userguide_extensions_structure_putting_together:

Putting it Together
~~~~~~~~~~~~~~~~~~~

For built-in Bokeh models, the implementation in BokehJS is automatically
matched with the corresponding Python model by the build process. In order
connect JavaScript implementations to Python models, one additional step
is needed. The Python class should have have a class attribute called
``__implementation__`` whose value is the TypeScript (or JavaScript or
CoffeeScript) code that the defines the client-side model as well as any
optional views.

Assuming the TypeScript code above was saved in a file ``custom.ts``,
then the complete Python class might look like:

.. code-block:: python

    from bokeh.core.properties import String, Instance
    from bokeh.models import LayoutDOM, Slider

    class Custom(LayoutDOM):

        __implementation__ = "custom.ts"

        text = String(default="Custom text")

        slider = Instance(Slider)

Then, if this class is defined in a Python module ``custom.py`` then the custom
extension can now be used exactly like any built-in Bokeh model:

.. code-block:: python

    from bokeh.io import show, output_file
    from bokeh.layouts import column
    from bokeh.models import Slider

    slider = Slider(start=0, end=10, step=0.1, value=0, title="value")

    custom = Custom(text="Special Slider Display", slider=slider)

    layout = column(slider, custom)

    show(layout)

Which results in the output below. The JavaScript code for the implementation
is automatically included in the rendered document. Scrub the slider to see
the special header update as the slider moves:

.. bokeh-plot:: docs/user_guide/examples/extensions_putting_together_ts.py
    :source-position: none

.. _userguide_extensions_specifying_implemenation_languages:

Specifying Implementation Languages
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If the value of ``__implementation__`` is a single line that ends in one of
the know extensions ``.coffee``, ``.js``, or ``.ts`` then the it is interpreted
as a filename. The corresponding file is opened and its contents are compiled
appropriately according to the file extension.

Othewise, if the implementation is inline in the class, the language for the
source code may be explicitly provided by using the classes ``CoffeeScript``,
``JavaScript``, or ``TypeScript``, e.g.

.. code-block:: python

    class Custom(Model):

        __implementation__ = JavaScript(" <JS code here> ")

Otherwise, if a plain string is given, it is assumed to be ``CoffeeScript``.

.. _userguide_extensions_supplying_external_resources:

Supplying External Resources
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

As part of implementing a custom model in Bokeh, there may be the need to
include third-party javascript libraries or css resources. Bokeh supports
supplying external resources through the Python class attributes
``__javascript__`` and ``__css__`` of custom models.

Including the URL paths to external resources will causes Bokeh to add
the resources to the html document head, causing the Javascript library to be
available in the global namespace and the custom CSS styling to be applied.

One example is including the JS and CSS files for `KaTex`_ (a
Javascript-based typesetting library that supports LaTex) in order to create
a ``LaTexLabel`` custom model.

.. code-block:: python

    class LatexLabel(Label):
        """A subclass of the Bokeh built-in `Label` that supports rendering
        LaTex using the KaTex typesetting library.
        """
        __javascript__ = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.js"
        __css__ = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.6.0/katex.min.css"
        __implementation__ = """
        # do something here
        """

See the LaTex example in the extensions gallery below to see the full
implementation and resulting output.

.. _userguide_extensions_structure_server_integration:

Integration with Bokeh Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

No special work or modification is needed to integrate custom user extensions
with the Bokeh server. As for standalone documents, the JavaScript
implementation is automatically included in the rendered application.
Additionally the standard synchronization of Bokeh model properties that
happens for all built-in models happens transparently for custom user
extensions as well.

.. _userguide_extensions_examples:

Examples
--------

Here we present some complete examples to serve as a reference. It is hoped
that the information in this section is a useful point of departure for anyone
creating a custom extensions. However, creating extensions is a somewhat
advanced topic. In many cases, it will be required to study the source code
of the base classes in :bokeh-tree:`bokehjs/src/coffee/models`.

For any questions that remain, please contact any of the sources in
:ref:`userguide_info`.Collaborating with the community will help make additions
and improvements to this section for future users.

.. toctree::

    extensions_gallery/ticking
    extensions_gallery/tool
    extensions_gallery/wrapping
    extensions_gallery/latex
    extensions_gallery/widget

:ref:`userguide_extensions_examples_ticking`
    Subclass built-in Bokeh models for axis ticking to customize their
    behaviour.

:ref:`userguide_extensions_examples_tool`
    Make a completely new tool that can draw on a plot canvas.

:ref:`userguide_extensions_examples_wrapping`
    Connect Python to a third-party JavaScript library by wrapping it with
    a Bokeh custom extension.

:ref:`userguide_extensions_examples_latex`
    Include a third-party JavaScript library in order to render LaTex.

:ref:`userguide_extensions_examples_widget`
    Include a third-party JavaScript library in an extension widget.

.. _CoffeeScript: http://coffeescript.org
.. _KaTex: https://khan.github.io/KaTeX/
.. _TypeScript: https://www.typescriptlang.org/
