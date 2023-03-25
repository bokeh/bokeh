.. _ug_interaction_python_callbacks:

Python callbacks
================

Python callbacks (sometimes also called *event handlers*) are Python functions
that you can attach to widgets. You can only use these callbacks in
:ref:`Bokeh server <ug_server>` apps. For interactive callbacks that
don't require a Bokeh server, see :ref:`ug_interaction_js_callbacks`.

Bokeh's Python callbacks are called when certain attributes on a Bokeh
:class:`~bokeh.model.Model` are changed. The function signature of event
handlers is determined by how they are attached to widgets (whether by
``.on_change`` or ``.on_event``, for example).

``on_change`` callback triggers
-------------------------------

All :ref:`widgets <ug_interaction_widgets>`, for example, have an
``.on_change`` method that takes an attribute name and one or more event
handlers as parameters. These handlers are expected to have the function
signature, ``(attr, old, new)``, where ``attr`` refers to the changed
attribute's name, and ``old`` and ``new`` refer to the previous and updated
values of the attribute.

.. code-block:: python

    def my_text_input_handler(attr, old, new):
        print("Previous label: " + old)
        print("Updated label: " + new)

    text_input = TextInput(value="default", title="Label:")
    text_input.on_change("value", my_text_input_handler)

For more information about the attributes to watch using ``.on_change``, see the
respective Model's under |bokeh.models| in the |reference guide|.

``on_event`` callback triggers
------------------------------

Additionally, some widgets, including the
:ref:`ug_interaction_widgets_examples_button`,
:ref:`ug_interaction_widgets_examples_dropdown`, and
:ref:`ug_interaction_widgets_examples_checkboxgroup`, have
an ``.on_event`` method that takes an event handler as its only parameter. For
a plain ``Button``, this handler is called without parameters. For the other
widgets with ``.on_event``, the handler is passed the new attribute value.

.. code-block:: python

    def my_radio_handler(new):
        print('Radio button option ' + str(new) + ' selected.')

    radio_group = RadioGroup(labels=["Option 1", "Option 2", "Option 3"], active=0)
    radio_group.on_event('button_click', my_radio_handler)

.. raw:: html

    <div>
    <iframe
        src="https://demo.bokeh.org/sliders"
        frameborder="0"
        style="overflow:hidden;height:400px;width: 90%;

        -moz-transform-origin: top left;
        -webkit-transform-origin: top left;
        -o-transform-origin: top left;
        -ms-transform-origin: top left;
        transform-origin: top left;"
        height="460"
    ></iframe>
    </div>

For more information about the attributes to watch using ``.on_event``, see the
respective entry for a widget under |bokeh.models| in the |reference guide|.
