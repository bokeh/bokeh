{{ name }}
{{ "~" * name|length }}

.. autoclass::  {{ module_name }}.{{ name }}
    :members:
    :show-inheritance:
    :inherited-members:
    :exclude-members: js_event_callbacks, js_property_callbacks, subscribed_events

    .. _{{ name }}.json:

    .. collapsible-code-block:: javascript
        :heading: JSON Prototype

        {{ model_json|indent(8) }}

    .. autoclasstoc::
