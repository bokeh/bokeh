.. _ug_interaction_sliders:

Sliders
=======

Sliders allow selecting one or more values from a range by dragging handles
along a track, or by using the keyboard. This section describes the available
slider types, how users can interact with them, and how to style them. For
basic usage of each slider type, see :ref:`ug_interaction_widgets_examples`.

.. _ug_interaction_sliders_types:

Slider types
------------

All sliders share the properties of
:class:`~bokeh.models.widgets.sliders.AbstractSlider`, like ``title``,
``orientation``, ``show_value``, ``tooltips`` and ``appearance``. They differ in
the type and the number of selected values:

======================================================================  ==========================  ==================================
Slider                                                                  ``value``                   ``step``
======================================================================  ==========================  ==================================
:class:`~bokeh.models.widgets.sliders.Slider`                           a number                    a number, or ``None`` (continuous)
:class:`~bokeh.models.widgets.sliders.RangeSlider`                      a pair of numbers           a number
:class:`~bokeh.models.widgets.sliders.MultiValuedSlider`                a sequence of numbers       a number
:class:`~bokeh.models.widgets.sliders.CategoricalSlider`                one of ``categories``       one category
:class:`~bokeh.models.widgets.sliders.DateSlider`                       a date                      a number of days
:class:`~bokeh.models.widgets.sliders.DateRangeSlider`                  a pair of dates             a number of days
:class:`~bokeh.models.widgets.sliders.DatetimeRangeSlider`              a pair of datetimes         a number of milliseconds
======================================================================  ==========================  ==================================

Each value has its own handle. In a range slider, the two handles are connected
by a span, which can be dragged and focused to move the whole range. Handles of
range and multi-valued sliders can't pass each other.

If ``start`` is greater than ``end``, then the slider is reversed, i.e. its
values increase from right to left (or from top to bottom for vertical
sliders). Vertical sliders have their minimum at the bottom.

Setting ``appearance="stealth"`` hides handles, unless the pointer hovers over
the slider or a handle has keyboard focus.

.. _ug_interaction_sliders_interaction:

Interacting with sliders
------------------------

Using a pointer (mouse, touch or pen):

* Drag a handle to change its value.
* Press the track to move the nearest handle to that position, and continue
  dragging it.
* Drag the span of a range slider to move both handles, preserving the width
  of the range.
* Scroll the mouse wheel over the slider to move the nearest handle (or both
  handles of a range slider) by one step, like with the up and down arrow keys.

Using the keyboard, after focusing a handle (or the span of a range slider)
with :kbd:`Tab`:

========================================================  =============================================================
Key                                                       Action
========================================================  =============================================================
:kbd:`Tab`, :kbd:`Shift+Tab`                              move focus between handles (and the span)
:kbd:`Left`, :kbd:`Right`                                 increase or decrease the value by one step
:kbd:`Down`, :kbd:`Up`                                    increase or decrease the value by one step
:kbd:`Page Up`, :kbd:`Page Down`                          increase or decrease the value by ``step_multiplier`` steps
:kbd:`Home`, :kbd:`End`                                   set the minimum or the maximum value
========================================================  =============================================================

Arrows along the slider's axis move handles in their visual direction, which
matters for reversed sliders. All other keys follow values, i.e. increase or
decrease them regardless of the slider's direction.

A handle stops at its neighboring handles. When the span of a range slider has
focus, the keys move the whole range instead.

Holding a key accelerates changes: after every ``acceleration_interval``
auto-repeated key presses, the step doubles, up to ``acceleration_max`` times
the original step (``acceleration_max=1`` disables acceleration). For sliders
without a ``step``, one step is ``default_step`` of the slider's range.

.. _ug_interaction_sliders_throttling:

Value throttling
----------------

A slider's ``value`` is updated continuously while dragging a handle or holding
a key. Every update triggers ``value`` callbacks and, in Bokeh server
applications, is synchronized with Python. This is useful for immediate
feedback, but can be too expensive if the callback, for example, recomputes
data.

The read-only ``value_throttled`` property has the same value, but it's only
updated at the end of an interaction, i.e. when the pointer or the key is
released, or when the slider loses focus. Use it for expensive callbacks:

.. code-block:: python

    slider = Slider(start=0, end=100, value=50, step=1)

    # called for every intermediate value
    slider.js_on_change("value", CustomJS(code="console.log(this.value)"))

    # called once per interaction, e.g. in a Bokeh server application
    def update(attr, old, new):
        ...  # expensive computation

    slider.on_change("value_throttled", update)

.. _ug_interaction_sliders_styling:

Styling sliders
---------------

Sliders are rendered in shadow DOM, so you can style them with CSS using their
``stylesheets`` property (see :ref:`ug_styling_dom`). The following example
creates a hue slider and an alpha slider, which update the color of a box:

.. bokeh-plot:: __REPO__/examples/styling/widgets/color_sliders.py
    :source-position: below

The hue slider replaces the track's background with a color gradient, hides
the span, and colors its handle using the handle's position (``--at``). The
alpha slider makes its track and handle larger (``--track-size`` and
``--handle-size``), draws a checkerboard pattern under a gradient of the
selected hue, and makes its handle transparent. A callback updates the hue of
the alpha slider's gradient by replacing one of its stylesheets, which defines
the custom ``--hue`` variable.

Slider elements have the following CSS classes:

==================  ====================================================================
Class               Element
==================  ====================================================================
``.bk-title``       the title and the formatted value (``.bk-value``)
``.bk-slider``      the area for interacting with a pointer, which contains the track
``.bk-track``       the track along which handles move
``.bk-span``        the span, i.e. the selected part of the track (``.bk-draggable``
                    in range sliders)
``.bk-handle``      a handle
``.bk-tooltip``     a handle's tooltip
==================  ====================================================================

The following classes indicate a slider's state. ``.bk-horizontal``,
``.bk-vertical``, ``.bk-disabled`` and ``.bk-stealth`` are applied to the
slider itself, so use them with ``:host()`` (e.g.
``:host(.bk-vertical) .bk-track``). ``.bk-dragging`` is applied to handles
being dragged, and ``.bk-focus-visible`` to a handle or the span with keyboard
focus. Use ``.bk-focus-visible`` instead of ``:focus-visible``, because sliders
track keyboard focus on their own.

Sliders define the following CSS variables, which you can override in
stylesheets:

=============================  ===========  ============================================================
Variable                       Default      Description
=============================  ===========  ============================================================
``--track-size``               ``0.5em``    the thickness of the track
``--handle-size``              ``1.0em``    the size of handles
``--default-size``             ``300px``    the length of the slider, if ``width`` (or ``height`` for
                                            vertical sliders) isn't set
``--slider-outline-offset``    ``2px``      the offset of the focus outline of handles and the span
=============================  ===========  ============================================================

Sliders also set the following CSS variables on their elements, which you can
use (but not override) in stylesheets:

=============================  ==========================================================================
Variable                       Description
=============================  ==========================================================================
``--at``                       a handle's position along the track, from ``0`` (left or top) to ``1``
                               (right or bottom)
``--start``, ``--end``         the positions of the span's ends along the track, from ``0`` to ``1``
=============================  ==========================================================================

Colors and outlines use the theme's CSS variables, so sliders follow the
current theme (see :ref:`ug_styling_themes`):

* ``--highlight-color`` for handles and the focus outline (with
  ``--outline-width`` and ``--outline-style``)
* ``--active-background-color`` for the span
* ``--surface-background-color`` for the track
* ``--border-color`` for borders of the track and tooltips
* ``--disabled-color`` for handles of disabled sliders
* ``--background-color``, ``--color`` and ``--inherit-color`` for the
  background and text
