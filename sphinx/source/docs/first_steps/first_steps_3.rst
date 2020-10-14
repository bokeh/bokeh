.. _first_steps_3:

First steps 3: Adding legends, text, and annotations
====================================================

In the :ref:`previous first steps guide <first_steps_2>`, you generated
different glyphs and defined their appearance.

In this section, you will add and style a :ref:`legend<first_steps_3_legend>`
and a :ref:`headline<first_steps_3_headlines>`. You will also add additional
information to your plot by including
:ref:`annotations<first_steps_3_annotations>`.

.. _first_steps_3_legend:

Adding and styling a legend
---------------------------

Bokeh automatically adds a legend to your plot if you include the
``legend_label`` attribute when calling the renderer function. For example:

.. code-block:: python

    p.circle(x, y3, legend_label="Objects")

This adds a legend with the entry "Objects" to your plot.

Use the properties of the :class:`~bokeh.models.annotations.Legend` object to
customize the legend. For example:

.. literalinclude:: examples/first_steps_3_legend.py
   :language: python
   :emphasize-lines: 19,22,25-27,30-34

.. bokeh-plot:: docs/first_steps/examples/first_steps_3_legend.py
    :source-position: none

.. seealso::
    To learn more about legends, see :ref:`userguide_plotting_legends` in the
    annotations section and :ref:`userguide_styling_legends` in the styling
    section of the user guide. The entry
    :class:`~bokeh.models.annotations.Legend` in the reference guide contains a
    list of all available attributes for legends.

.. _first_steps_3_headlines:

Customizing headlines
---------------------

Most of the examples so far have included a headline. You did this by passing
the ``title`` argument to the :func:`~bokeh.plotting.figure` figure function:

.. code-block:: python

    p = figure(title="Headline example")

There are various ways to style the text for your headline. For example:

.. literalinclude:: examples/first_steps_3_title.py
   :language: python
   :emphasize-lines: 17,20,23-26

.. bokeh-plot:: docs/first_steps/examples/first_steps_3_title.py
    :source-position: none

.. seealso::
    For more information on working with ``title``, see
    :ref:`userguide_plotting_titles` in the user guide. In the reference guide,
    the entry for :class:`~bokeh.models.annotations.Title` contains a list of
    all available properties.

.. _first_steps_3_annotations:

Using annotations
-----------------

Annotations are additional elements that you add to your plot to make it easier
to read. More information on the various visual aids is available in the section
:ref:`userguide_annotations`.

One example are box annotations. You can use box annotations to highlight
certain areas of your plot:

.. bokeh-plot:: docs/first_steps/examples/first_steps_3_box_annotation.py
    :source-position: none

First, import the :class:`~bokeh.models.annotations.BoxAnnotation` class from
Bokeh's :class:`~bokeh.models` collection:

.. code-block:: python

    from bokeh.models import BoxAnnotation

Next, create the :class:`~bokeh.models.annotations.BoxAnnotation` objects. If
you do not pass a value for ``bottom`` or ``top``, Bokeh automatically extends
the box's dimension to the edges of the plot:

.. code-block:: python

    low_box = BoxAnnotation(top=80, fill_alpha=0.1, fill_color='red')
    mid_box = BoxAnnotation(bottom=80, top=180, fill_alpha=0.1, fill_color='green')
    high_box = BoxAnnotation(bottom=180, fill_alpha=0.1, fill_color='red')

Finally, you need to add the :class:`~bokeh.models.annotations.BoxAnnotation`
objects to your existing figure. Use the
:func:`~bokeh.models.plots.Plot.add_layout` method to add your boxes:

.. code-block:: python

    p.add_layout(low_box)
    p.add_layout(mid_box)
    p.add_layout(high_box)

This is what the finished code looks like:

.. literalinclude:: examples/first_steps_3_box_annotation.py
   :language: python
   :emphasize-lines: 3,20-22,25-27

.. seealso::
    To find out more about annotations, see :ref:`userguide_annotations` in the
    user guide.

.. panels::
    :column: col-lg-6 col-md-6 col-sm-6 col-xs-12 p-2

    .. link-button:: first_steps_2.html
        :text: Previous
        :classes: stretched-link

    ---
    :card: + text-right
    .. link-button:: first_steps_4.html
        :text: Next
        :classes: stretched-link

