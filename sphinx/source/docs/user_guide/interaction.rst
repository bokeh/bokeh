.. _userguide_interaction:

Responding to interactions
==========================

Bokeh offers several ways to respond to browser-based interactions from users. A
lot of this interactivity can be defined in Python, with no or only limited
JavaScript required.

:ref:`userguide_interaction_linked`
    Bokeh makes it simple to add certain kinds of linked interactions between
    plots, such as linked ranges when panning and zooming, or linked
    highlighting when making selections.

:ref:`userguide_interaction_legends`
    Bokeh ``Legends`` can be configured to allow for easily hiding or muting
    corresponding glyphs.

:ref:`userguide_interaction_widgets`
    Bokeh comes with a rich set of widgets that can be used with either
    client-side JavaScript callbacks, or with real Python code in a Bokeh
    server application.

:ref:`userguide_interaction_jscallbacks`
    Bokeh's ``CustomJS`` callbacks allow you to define JavaScript-based custom
    interactivity for various widgets and events in Bokeh documents.

:ref:`userguide_interaction_jscallbacks`
    In :ref:`Bokeh Server apps <userguide_server>`, you can use Bokeh's Python
    callbacks to define custom interactivity for various widgets and events.

:ref:`userguide_interaction_tooltips`
    Bokeh lets you use tooltips to add additional information to most UI
    elements in your visualization.

.. toctree::
   :hidden:

   interaction/linking
   interaction/legends
   interaction/widgets
   interaction/js_callbacks
   interaction/python_callbacks
   interaction/tooltips
