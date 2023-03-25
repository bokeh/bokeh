.. _ug_interaction:

Interaction
===========

Bokeh offers several ways to respond to browser-based interactions from users. A
lot of this interactivity can be defined in Python, with no or only limited
JavaScript required.

:ref:`ug_interaction_tools`
    Bokeh makes it simple to add certain kinds of linked interactions between
    plots, such as linked ranges when panning and zooming, or linked
    highlighting when making selections.

:ref:`ug_interaction_linked`
    Bokeh makes it simple to add certain kinds of linked interactions between
    plots, such as linked ranges when panning and zooming, or linked
    highlighting when making selections.

:ref:`ug_interaction_legends`
    Bokeh ``Legends`` can be configured to allow for easily hiding or muting
    corresponding glyphs.

:ref:`ug_interaction_widgets`
    Bokeh comes with a rich set of widgets that can be used with either
    client-side JavaScript callbacks, or with real Python code in a Bokeh
    server application.

:ref:`ug_interaction_js_callbacks`
    Bokeh's ``CustomJS`` callbacks allow you to define JavaScript-based custom
    interactivity for various widgets and events in Bokeh documents.

:ref:`ug_interaction_python_callbacks`
    In :ref:`Bokeh Server apps <ug_server>`, you can use Bokeh's Python
    callbacks to define custom interactivity for various widgets and events.

:ref:`ug_interaction_tooltips`
    Bokeh lets you use tooltips to add additional information to most UI
    elements in your visualization.

.. toctree::
   :hidden:

   interaction/tools
   interaction/linking
   interaction/legends
   interaction/widgets
   interaction/js_callbacks
   interaction/python_callbacks
   interaction/tooltips
