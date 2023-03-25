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

Use the properties of the |Legend| object to customize the legend. For example:

.. literalinclude:: examples/first_steps_3_legend.py
   :language: python
   :emphasize-lines: 16,24,27,30-32,35-39

.. bokeh-plot:: docs/first_steps/examples/first_steps_3_legend.py
    :source-position: none

.. seealso::
    To learn more about legends, see :ref:`ug_basic_annotations_legends` in the
    annotations section and :ref:`ug_styling_plots_legends` in the styling
    section of the user guide. The entry |Legend| in the reference guide
    contains a list of all available attributes for legends.

    See |interactive legends| in the user guide to learn about using legends to
    hide or mute glyphs in a plot.

.. _first_steps_3_headlines:

Customizing headlines
---------------------

Most of the examples so far have included a headline. You did this by passing
the ``title`` argument to the |figure| function:

.. code-block:: python

    p = figure(title="Headline example")

There are various ways to style the text for your headline. For example:

.. literalinclude:: examples/first_steps_3_title.py
   :language: python
   :emphasize-lines: 8,14,17,20-23

.. bokeh-plot:: docs/first_steps/examples/first_steps_3_title.py
    :source-position: none

.. seealso::
    For more information on working with ``title``, see
    :ref:`ug_basic_annotations_titles` in the user guide. In the reference guide,
    the entry for :class:`~bokeh.models.annotations.Title` contains a list of
    all available properties.

.. _first_steps_3_annotations:

Using annotations
-----------------

Annotations are visual elements that you add to your plot to make it easier
to read. For more information on the various kinds of annotations, see
:ref:`ug_basic_annotations` in the user guide.

One example are box annotations. You can use box annotations to highlight
certain areas of your plot:

.. bokeh-plot:: docs/first_steps/examples/first_steps_3_box_annotation.py
    :source-position: none

To add box annotations to your plot, you first need to import the
|BoxAnnotation| class from |bokeh.models|:

.. code-block:: python

    from bokeh.models import BoxAnnotation

Next, create the |BoxAnnotation| objects. If you do not pass a value for
``bottom`` or ``top``, Bokeh automatically extends the box's dimension to the
edges of the plot:

.. code-block:: python

    low_box = BoxAnnotation(top=20, fill_alpha=0.2, fill_color="#F0E442")
    mid_box = BoxAnnotation(bottom=20, top=80, fill_alpha=0.2, fill_color="#009E73")
    high_box = BoxAnnotation(bottom=80, fill_alpha=0.2, fill_color="#F0E442")

Finally, you need to add the |BoxAnnotation| objects to your existing figure.
Use the |add layout| method to add your boxes:

.. code-block:: python

    p.add_layout(low_box)
    p.add_layout(mid_box)
    p.add_layout(high_box)

This is what the finished code looks like:

.. literalinclude:: examples/first_steps_3_box_annotation.py
   :language: python
   :emphasize-lines: 3,17-19,22-24

.. seealso::
    To find out more about the different kinds of annotations in Bokeh, see
    :ref:`ug_basic_annotations` in the user guide.

.. |BoxAnnotation|      replace:: :py:class:`~bokeh.models.annotations.BoxAnnotation`
