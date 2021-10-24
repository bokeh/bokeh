.. _contributor_guide_python:

Contributing Python code
========================

The Bokeh codebase combines code written in Python and :ref:`TypeScript
<contributor_guide_bokehjs>`. This chapter provides an overview of the most
important things to know when working on Bokeh's Python code.

.. _contributor_guide_python_style:

Code style
----------

Bokeh's Python code generally follows the `PEP8`_ standard. Some notable
exceptions include:

* for consistency, use double quotation marks for strings (``"string"``)
* don't write lines that are longer than 165 characters
* write `Google Python Style Guide`_ docstrings (see
  :ref:`contributor_guide_documentation_edit_docstrings` for more information)

Bokeh uses a combination of code quality tests for each :ref:`Pull Request
<contributor_guide_pull_requests>`. Relevant tests for Python code include
`Flake8`_ and `isort`_. Use the following command to run those codebase tests
locally:

.. code-block:: sh

    pytest tests/codebase

To learn more about running those tests on your system, see
:ref:`contributor_guide_testing_local_codebase`.

.. _contributor_guide_python_tests:

Tests
-----

All :ref:`Pull Requests <contributor_guide_pull_requests>` that add or update
code should include new or updated tests. See :ref:`contributor_guide_testing`
and :ref:`contributor_guide_writing_tests` for more information on testing,
including Python-specific tests.

.. _contributor_guide_python_models:

Models and properties
---------------------

The central building blocks of all Bokeh visualizations are objects based on
Bokeh's :term:`models <Model>`. These models are representations of
:term:`plot <Plot>` elements, such as axes, :term:`glyphs <Glyph>`, or
:term:`widgets <Widget>`.

On the Python side, Bokeh serializes the attributes of each plot element object
into JSON data. On the browser side, BokehJS deserializes this JSON data and
creates JavaScript objects based on this information. :term:`BokehJS` then uses
these JavaScript objects to render the visualization.

.. image:: /_images/bokeh_bokehjs.svg
    :class: image-border
    :alt: Flowchart describing the flow of data from Python objects through JSON
          to the browser-side. There, the JSON data is converted into JavaScript
          objects which then get rendered as output. Output can be HTML Canvas,
          WebGL, or SVG.
    :align: center
    :width: 100%

All of those models are subclasses of :class:`bokeh.models`. They all inherit
from the :class:`~bokeh.core.has_props.HasProps` base class:

.. code-block:: python

    class Whatever(HasProps):
        """ `Whatever` model. """

Models contain properties, which are class attributes defined in
:class:`bokeh.core.properties`. For example:

.. code-block:: python

    class IntProps(HasProps):
        prop1 = Int()
        prop2 = Int(10)

In this example, the `IntProps` model represents objects that have two integer
values, ``prop1`` and ``prop2``.

Bokeh uses a wide variety of property types:

* Primitive types like :class:`~bokeh.core.properties.Byte`,
  :class:`~bokeh.core.properties.Int`, :class:`~bokeh.core.properties.Float`,
  :class:`~bokeh.core.properties.Complex`, or
  :class:`~bokeh.core.properties.String`
* Container-like properties that take other properties as parameters, such as
  :class:`~bokeh.core.properties.List` (``List(Int)``) or
  :class:`~bokeh.core.properties.Dict` (``Dict(String, Double)``)
* Specialized types like :class:`~bokeh.core.properties.Instance`
  (``Instance(Plot)``), :class:`~bokeh.core.properties.Enum`
  (``Enum("foo", "bar", "baz")``), or :class:`~bokeh.core.properties.Either`
  (``Either(Int, String)``)

These property types have several purposes:

* :ref:`type checking <contributor_guide_python_typing>` the different models
* making sure that models remain compatible between Python and JavaScript
* automatically generating some basic documentation for the |reference guide|

An example of a more realistic model might look like this:

.. code-block:: python

    class Sample(HasProps):
        prop1 = Int(127)
        prop2 = Either(Int, List(Int), Dict(String, List(Int)))
        prop3 = Enum("x", "y", "z")
        prop4 = Range(Float, 0.0, 1.0)
        prop5 = List(Instance(Range1d))

See :ref:`bokeh.core.properties` for more details.

.. warning::
    The class :class:`~bokeh.core.properties.Any` is the super-type of all other
    types and will accept any type of value. Since this circumvents all type
    validation, make sure to use it sparingly, if at all.

.. _contributor_guide_python_typing:

Typing
------

Bokeh uses two systems for type checking Python code:

* For the :ref:`system of models described above
  <contributor_guide_python_models>`, Bokeh uses its own system of
  properties. See :ref:`contributor_guide_python_models` for more information.
* For any code not using models, Bokeh uses `PEP 484
  <https://www.python.org/dev/peps/pep-0484/>`_ style hints. Use the Python
  standard `typing` and `typing_extensions` modules if necessary.

:ref:`Bokeh's CI <contributor_guide_testing_ci>` uses `mypy`_ to check types.
To type check your code locally, run ``mypy bokeh``.

.. _PEP8: https://www.python.org/dev/peps/pep-0008/
.. _Google Python Style Guide: https://google.github.io/styleguide/pyguide.html#383-functions-and-methods
.. _Flake8: https://flake8.pycqa.org/
.. _isort: https://pycqa.github.io/isort/
.. _mypy: https://mypy.readthedocs.io
