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

Bokeh is officially supported and tested on Python 3.7 and above (CPython).

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
resources of the :ref:`user guide <userguide>` and
:ref:`reference guide <refguide>` in case you want to learn more about any of
the topics covered in the first steps guides.

.. panels::
    :container: container-fluid pb-3
    :column: col-lg-4 col-md-6 col-sm-12 col-xs-12 p-2

    :header: bg-bokeh-one

    Creating a simple line chart plot
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    .. image:: /_images/first_steps_1.png
        :align: center
        :alt: A line chart

    +++

    .. link-button:: first_steps/first_steps_1
        :text: Go to section 1
        :type: ref
        :classes: btn-info btn-block stretched-link

    ---
    :header: bg-bokeh-two

    Adding and customizing renderers
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    .. image:: /_images/first_steps_2.png
        :align: center
        :alt: Several glyphs in one chart

    +++

    .. link-button:: first_steps/first_steps_2
        :text: Go to section 2
        :type: ref
        :classes: btn-info btn-block stretched-link

    ---
    :header: bg-bokeh-three

    Adding legends, text, and annotations
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    .. image:: /_images/first_steps_3.png
        :align: center
        :alt: A chart with a legend

    +++

    .. link-button:: first_steps/first_steps_3
        :text: Go to section 3
        :type: ref
        :classes: btn-info btn-block stretched-link

    ---
    :header: bg-bokeh-four

    Customizing your plot
    ^^^^^^^^^^^^^^^^^^^^^

    .. image:: /_images/first_steps_4.png
        :align: center
        :alt: A chart with a tootip

    +++

    .. link-button:: first_steps/first_steps_4
        :text: Go to section 4
        :type: ref
        :classes: btn-info btn-block stretched-link

    ---
    :header: bg-bokeh-five

    Vectorizing glyph properties
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    .. image:: /_images/first_steps_5.png
        :align: center
        :alt: A chart with different colors

    +++

    .. link-button:: first_steps/first_steps_5
        :text: Go to section 5
        :type: ref
        :classes: btn-info btn-block stretched-link
    ---
    :header: bg-bokeh-six

    Combining plots
    ^^^^^^^

    .. image:: /_images/first_steps_6.png
        :align: center
        :alt: Three charts combined into one element

    +++

    .. link-button:: first_steps/first_steps_6
        :text: Go to section 6
        :type: ref
        :classes: btn-info btn-block stretched-link

    ---
    :header: bg-bokeh-seven

    Displaying and exporting
    ^^^^^^^^^^^^^^^^^^^^^^^^

    .. image:: /_images/first_steps_7.png
        :align: center
        :alt: Screenshot of a Bokeh plot in a Jupyter notebook

    +++

    .. link-button:: first_steps/first_steps_7
        :text: Go to section 7
        :type: ref
        :classes: btn-info btn-block stretched-link
    ---
    :header: bg-bokeh-one

    Providing and filtering data
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    .. image:: /_images/first_steps_8.png
        :align: center
        :alt: Two charts with different subsets of data

    +++

    .. link-button:: first_steps/first_steps_8
        :text: Go to section 8
        :type: ref
        :classes: btn-info btn-block stretched-link

    ---
    :header: bg-bokeh-two

    Using widgets
    ^^^^^^^^^^^^^

    .. image:: /_images/first_steps_9.png
        :align: center
        :alt: Screenshot of a Bokeh server app

    +++

    .. link-button:: first_steps/first_steps_9
        :text: Go to section 9
        :type: ref
        :classes: btn-info btn-block stretched-link

.. _Anaconda: https://www.anaconda.com/products/individual#Downloads
.. _Miniconda: https://docs.conda.io/en/latest/miniconda.html
