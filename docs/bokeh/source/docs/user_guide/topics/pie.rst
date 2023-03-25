.. _ug_topics_pie:

Pie and donut charts
====================

Bokeh does not have built-in APIs for pie and donut charts. However, you can
use Bokeh's various wedge glyphs to create these kinds of charts.

.. _ug_topics_pie_glyphs:

Glyphs
------

Wedge
~~~~~

The |wedge| glyph method renders a filled wedge. It accepts ``radius``,
``start_angle``, and ``end_angle`` to determine position. Additionally, the
``direction`` property determines whether to render clockwise (``"clock"``)
or anti-clockwise (``"anticlock"``) between the start and end angles.

.. bokeh-plot:: __REPO__/examples/topics/pie/wedge.py
    :source-position: above

Annular wedge
~~~~~~~~~~~~~

The |annular_wedge| glyph method is similar to |wedge| but leaves an inner
portion of the wedge hollow. It accepts an ``inner_radius`` and
``outer_radius`` instead of just ``radius``.

.. bokeh-plot:: __REPO__/examples/topics/pie/annular_wedge.py
    :source-position: above

Annulus
~~~~~~~

Finally, the |annulus| glyph method also accepts ``inner_radius`` and
``outer_radius`` to produce hollow circles.

Pie chart
---------

Use the wedge glyph for each of the pie slices to create a pie chart:

.. bokeh-plot:: __REPO__/examples/topics/pie/pie.py
    :source-position: above

Donut chart
-----------

Donut charts are similar to pie charts, but employ annular wedges to
partition a ring region:

.. bokeh-plot:: __REPO__/examples/topics/pie/donut.py
    :source-position: above

.. |annular_wedge| replace:: :func:`~bokeh.plotting.figure.annular_wedge`
.. |annulus|       replace:: :func:`~bokeh.plotting.figure.annulus`
.. |wedge|         replace:: :func:`~bokeh.plotting.figure.wedge`
