.. _first_steps:

First steps
###########

.. toctree::
    :maxdepth: 2
    :hidden:
    :glob:

    first_steps/installation
    first_steps/*

.. _first_steps_installing:

Installing Bokeh
----------------

Bokeh is officially supported and tested on Python 3.6 and above (CPython).

You can install Bokeh with either ``conda`` or ``pip``:

.. panels::
    :container: container-fluid pb-3
    :column: col-lg-6 col-md-6 col-sm-12 col-xs-12 p-2

    :header: bg-bokeh-one

    Installing with ``conda``
    ^^^^^^^^^^^^^^^^^^^^^^^^^

    Use this command to install Bokeh:

    .. code-block:: sh

        conda install bokeh

    Conda requires either `Anaconda`_ or `Miniconda`_ to be installed on your
    system.

    ---
    :header: bg-bokeh-two

    Installing with ``pip``
    ^^^^^^^^^^^^^^^^^^^^^^^

    Use this command to install Bokeh:

    .. code-block:: sh

        pip install bokeh

For more detailed information on installing and potential problems you might
encounter, go to the :ref:`installation` section.

.. _`first_steps_overview`:

First steps guides
------------------

Follow these guides to quickly learn about the most important features and
capabilities of Bokeh.

The first steps guides are for anybody who is new to Bokeh. The only
prerequisites for using these guides are a basic understanding of Python and a
working :ref:`installation<first_steps_installing>` of Bokeh.

The first steps guides include lots of examples that you can copy to your
development environment. There are also many links to the more in-depth
resources of the :ref:`userguide` and :ref:`Reference Guide<refguide>` in case
you want to learn more about any of the topics.

(placeholders - add thubnails!)

.. panels::
    :container: container-fluid pb-3
    :column: col-lg-3 col-md-4 col-sm-6 col-xs-12 p-2

    :header: bg-bokeh-one

    Tutorial 1
    ^^^^^^^^^^

    Create a simple line graph.

    ---
    :header: bg-bokeh-two

    Tutorial 2
    ^^^^^^^^^^

    Combine several line graphs.

    ---
    :header: bg-bokeh-three

    Tutorial 3
    ^^^^^^^^^^

    Try different outputs

    ---
    :header: bg-bokeh-four

    Tutorial 4
    ^^^^^^^^^^

    Add headlines and other text.

    ---
    :header: bg-bokeh-five

    Tutorial 5
    ^^^^^^^^^^

    Vectorize colors and shapes

    ---
    :header: bg-bokeh-six

    Tutorial 6
    ^^^^^^^^^^

    Create html popup windows

    ---
    :header: bg-bokeh-seven

    Tutorial 7
    ^^^^^^^^^^

    Add headlines and other text.

    ---
    :header: bg-bokeh-one

    Tutorial 8
    ^^^^^^^^^^

    Combine plots with gridplot


List of tutorials as bootstrap boxes:

* Tutorial 1: Simple line graph
* Tutorial 2: Combining lines
* Tutorial X: Try different outputs (Jupyter Notebook, file export)
  * [do I need to install jupyter stuff manually?]
  * [do I need to install any firefox/gecko/selenium manually??? -> Update install.rst!!]
* Tutorial X: Vectorize color/shape
* Tutorial X: Add headlines and other text
* Tutorial X: Create html popup windows
* Tutorial X: Style everything
* Tutorial X: Combine plots with gridplot
* Tutorial X Create a server app

.. _Anaconda: https://www.anaconda.com/products/individual#Downloads
.. _Miniconda: https://docs.conda.io/en/latest/miniconda.html
