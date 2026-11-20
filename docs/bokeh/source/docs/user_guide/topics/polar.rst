.. _ug_topics_polar:

Polar plots
===========

Use :class:`~bokeh.models.coordinates.PolarMapping` to plot radius and angle
pairs in a circular frame. Supply explicit radial limits with a
:class:`~bokeh.models.ranges.Range1d`:

.. code-block:: python

    from bokeh.models import PolarMapping, Range1d
    from bokeh.plotting import figure

    p = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    p.scatter(radius=[2, 4, 6], angle=[0, 45, 90], size=10)

The default angular range is 0 to 360 degrees. Angle zero points east, and
angles increase counterclockwise. Set ``zero_direction`` and ``direction``
on the mapping to change these conventions. ``angle_units`` accepts
``"deg"``, ``"rad"``, ``"grad"``, or ``"turn"``. Set angular range bounds
in the same units as the data. When changing ``angle_units``, supply
``angular_range`` explicitly. For example, radians use
``angular_range=Range1d(0, 2*pi)``. The default angular range always uses
numeric bounds of 0 and 360.

Sectors and invalid data
------------------------

Set ``angular_range`` to display a sector. Its bounds must increase and span
at most one revolution. Use unwrapped bounds for a sector crossing zero,
such as ``Range1d(300, 420)``. Input angles wrap into the interval starting
at the lower bound, so 30 degrees appears at 390 degrees in this sector.
Angles outside the sector are omitted.

Radial limits must be finite, nonnegative, and increasing. The lower limit
maps to the center, and the upper limit maps to the outer circumference.
Negative radii, nonfinite coordinates, and points outside the radial limits
are omitted. Radial and angular auto-ranging are not supported in this
initial implementation.

Axes and grids
--------------

Polar figures create two :class:`~bokeh.models.axes.PolarAxis` renderers.
The radial axis follows the starting spoke, and the angular axis follows
the circumference. Each axis has a configurable ``ticker`` and ``formatter``,
``axis_line_*`` properties, and ``major_label_text_*`` properties.

Two :class:`~bokeh.models.grids.PolarGrid` renderers draw rings and spokes
using the corresponding axis tickers. Customize their ``grid_line_*``
properties, or set ``visible=False`` to hide a guide. The mapping's ``padding``
reserves space inside the rectangular frame for tick labels.

Polar axes and grids require a polar coordinate mapping. Validation reports
guides attached to a Cartesian coordinate system.

Degree-based polar figures use 45-degree spacing around a full circle by
default. Angular labels wrap into a single revolution starting at zero, so
the 300 to 420 degree sector is labeled 300, 330, 0, 30, and 60 when using
30-degree ticks. Set ``angular_axis.wrap_labels=False`` to display unwrapped
values instead.

.. code-block:: python

    from bokeh.models import FixedTicker, PolarAxis

    for axis in p.select(PolarAxis):
        if axis.dimension == "angular":
            axis.ticker = FixedTicker(ticks=[0, 90, 180, 270])

Interaction
-----------

Hover reports radius as ``$x`` and the unwrapped angle as ``$y``. The angle
at the frame center is undefined. Use field references such as ``@theta``
to display the original input angle instead.

Tap, rectangle, and lasso selection operate in screen space. Dragging pans
the whole polar frame horizontally and vertically. Wheel zoom magnifies the
frame around the pointer. Both operations preserve the radial and angular
limits. The rectangular
viewport clips the magnified or translated frame. Marker sizes and label fonts
remain screen-sized. Reset restores the original frame position, magnification,
and ranges. Undo and redo include view changes.

View position and magnification persist when the mapping is replaced.
Use reset to return to the initial view.

Pan and zoom are local to each plot view. Shared ranges still link changes to
the data limits, but do not link view translation or magnification.

The initial support requires unrestricted pan and wheel zoom tools with
``dimensions="both"``. They operate on the polar view. Dimension-restricted variants,
box zoom, zoom-in and zoom-out buttons, click pan, wheel pan, editing tools,
and the range tool are rejected when added to a polar plot. Validation also
checks tools inserted directly into the toolbar. Unsupported tools inserted
from JavaScript are ignored during interaction.

For selection events, ``x`` is radius and ``y`` is angle. Rectangle events
report the paired inverse coordinates of their two screen corners in
``x0, y0`` and ``x1, y1``. These are corner values rather than independent
radial and angular bounds. The screen rectangle remains authoritative.

The mapping owns the plot's ranges. A direct ``Plot(coordinate_system=...)``
also uses these ranges. If replacing either range from Python, update the
corresponding ``plot.x_range`` or ``plot.y_range`` reference as well. Validation
reports a mismatched reference.

Scatter markers
---------------

Use ``radius`` and ``angle`` together, or pass radius and angle as the first
and second positional arguments to ``scatter``. Use ``marker_angle`` for
marker rotation. Marker sizes remain in screen pixels.

.. bokeh-plot:: __REPO__/examples/topics/polar/scatter.py
    :source-position: above

Supported combinations
----------------------

Native polar plotting currently supports ``Scatter`` on whole figures,
linear radial scaling, and canvas rendering. Plots requesting WebGL use
canvas for polar markers. Other glyphs and native polar subplots are not
supported. Validation reports unsupported renderer and tool configurations,
and plotting methods reject them before adding them to the plot.

A polar parent cannot host renderers with a different coordinate mapping.
Cartesian subplots continue to use ``figure.subplot`` and ``SubplotMapping``.
The existing ``PolarTransform`` expressions remain available for plotting
polar data on Cartesian figures, including signed radii.
