.. _userguide_interaction:

Adding Interactions
===================

.. contents::
    :local:
    :depth: 2

.. _userguide_interaction_linking:

Linking Plots
-------------

It's often useful to link plots to add connected interactivity between plots.
This section shows an easy way to do it using the |bokeh.plotting| interface.

.. _userguide_interaction_linked_panning:

Linked Panning
~~~~~~~~~~~~~~

It's often desired to link pan or zooming actions across many plots. All that is
needed to enable this feature is to share range objects between |figure|
calls.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_linked_panning.py
    :source-position: above

Now you have learned how to link panning between multiple plots with the
|bokeh.plotting| interface.

.. _userguide_interaction_linked_brushing:

Linked Brushing
~~~~~~~~~~~~~~~

Linked brushing in Bokeh is expressed by sharing data sources between glyph
renderers. This is all Bokeh needs to understand that selections acted on one
glyph must pass to all other glyphs that share that same source.

The following code shows an example of linked brushing between circle glyphs on
two different |figure| calls.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_linked_brushing.py
    :source-position: above

Now you have learned how to link brushing between plots.

.. _userguide_interaction_widgets:

Adding Widgets
--------------

Bokeh provides a simple default set of widgets, largely based off the Bootstrap
JavaScript library. In the future, it will be possible for users to wrap and use
other widget libararies, or their own custom widgets. By themselves, most widgets
are not useful. There are two ways to use widgets to drive interactions:

* Use the ``CustomJS`` callback (see below). This will work in static HTML documents.
* Use the ``bokeh-server`` and set up event handlers with ``.on_change``.

The current value of interactive widgets is available from the ``.value``
attribute.

Button
~~~~~~

Bokeh provides a simple Button:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_button.py
    :source-position: below

Checkbox Button Group
~~~~~~~~~~~~~~~~~~~~~

Bokeh also provides a checkbox button group, that can have multiple options
selected simultaneously:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_checkbox_button_group.py
    :source-position: below

Checkbox Group
~~~~~~~~~~~~~~

A standard checkbox:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_checkbox_group.py
    :source-position: below

Data Table
~~~~~~~~~~

Bokeh provides a sophisticated data table widget based on SlickGrid. Note
that since the table is configured with a data source object, any plots that
share this data source will automatically have selections linked between the
plot and the table (even in static HTML documents).

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_data_table.py
    :source-position: below

Dropdown Menu
~~~~~~~~~~~~~

It is also possible to include Dropdown menus:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_dropdown_menu.py
    :source-position: below

MultiSelect
~~~~~~~~~~~

A multi-select widget to present multiple available options:

.. warning::
    MultiSelect is currently broken. See :bokeh-issue:`2495`

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_multiselect.py
    :source-position: below

Radio Button Group
~~~~~~~~~~~~~~~~~~

A radio button group can have at most one selected button at at time:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_radio_button_group.py
    :source-position: below

Radio Group
~~~~~~~~~~~

A radio group uses standard radio button appearance:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_radio_group.py
    :source-position: below

Select
~~~~~~

A single selection widget:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_select.py
    :source-position: below

Slider
~~~~~~

The Bokeh slider can be configured with ``start`` and ``end`` values, a ``step`` size,
an initial ``value`` and a ``title``:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_slider.py
    :source-position: below

Tab Panes
~~~~~~~~~

Tab panes allow multiple plots or layouts to be show in selectable tabs:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_tab_panes.py
    :source-position: below

TextInput
~~~~~~~~~

A widget for collecting a line of text from a user:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_textinput.py
    :source-position: below

Toggle Button
~~~~~~~~~~~~~

The toggle button holds an on/off state:

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_toggle_button.py
    :source-position: below

.. _userguide_interaction_actions:

Defining Callbacks
------------------

Bokeh exposes an increasing number of callbacks that can be specified
from the ``Python`` layer that results in an action on the ``javascript`` level without
the need of ``bokeh-server``.

.. _userguide_interaction_actions_openurl:

OpenURL
~~~~~~~

Opening an URL when users click on a glyph (for instance a circle marker) is
a very popular feature. Bokeh lets users enable this feature by exposing an
OpenURL callback object that can be passed to a Tap tool in order to have that
action called whenever the users clicks on the glyph.

The following code shows how to use the OpenURL action combined with a TapTool
to open an url whenever the user clicks on a circle.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_open_url.py
    :source-position: above

Now you have learned how to open an URL when the user clicks on a glyph.

.. _userguide_interaction_actions_widget_callbacks:

CustomJS for Widgets
~~~~~~~~~~~~~~~~~~~~

Bokeh lets you express even more advanced callbacks that must be called on
the Javascript side in order to add custom logic and interactivity when a
widget is used. For instance, we may want to change the data of a plot when
a user clicks on a button or changes a slider Widget.

Custom callbacks like these can be set using a CustomJS object and passing it
as the ``callback`` argument to a Widget object.

The code below shows an example of CustomJS set on a slider Widget that
changes the source of a plot when the slider is used.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_widgets.py
    :source-position: above

.. _userguide_interaction_actions_tool_callbacks:

CustomJS for Tools
~~~~~~~~~~~~~~~~~~

Bokeh allows for some tool events to trigger custom Javascript callbacks that
have access to the tool's attributes. Below, a callback on the BoxSelectTool
uses the selection box dimensions (accessed in the geometry field of the
cb_data object that is injected into the Callback code attribute), in order to
add a Rect glyph to the plot with identical dimensions.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_tools.py
    :source-position: above

.. _userguide_interaction_actions_selection_callbacks:

CustomJS for Selections
~~~~~~~~~~~~~~~~~~~~~~~

Bokeh also provides the means to specify the same kind of callback to be
executed whenever a selection changes. As a simple demonstration, the example
below simply copies selected points on the first plot to the second. However,
more sophisticated actions and computations are easily constructed in a
similar way.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_selections.py
    :source-position: above

Another more sophisticated example is shown below. It computes the average `y`
value of any selected points (including multiple disjoint selections), and draws
a line through that value.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_selections_lasso_mean.py
    :source-position: above

.. _userguide_interaction_actions_hover_callbacks:

CustomJS for Hover
~~~~~~~~~~~~~~~~~~

The HoverTool has a callback which comes with two pieces of built-in data: the
`index`, and the `geometry`. The `index` is the indices of any points that the
hover tool is over.

.. note::
    Hovers are considered "inspections" and do not normally set the selection
    on a data source. In an upcoming release, it will be possible to specify an
    ``inspection_glyph`` that will update a glyphs appearance when it is
    hovered over, without the need for any callback to set the selection as is
    done below.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_hover.py
    :source-position: above

.. _userguide_interaction_actions_range_update_callbacks:

CustomJS for Range Update
~~~~~~~~~~~~~~~~~~~~~~~~~

With Bokeh, ranges have a callback attribute that accept a Callback instance
and execute javascript code on range updates that are triggered by tool
interactions such as a box zoom, wheel scroll or pan.

.. bokeh-plot:: source/docs/user_guide/source_examples/interaction_callbacks_for_range_update.py
    :source-position: above

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
