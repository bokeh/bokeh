{{ name }}
{{ "~" * name|length }}

.. autoclass::  {{ module_name }}.{{ name }}
    :members:
    :show-inheritance:
    :inherited-members:

    .. autoclasstoc::

.. _{{ name }}.json:

.. collapsible-code-block:: javascript
    :heading: JSON Prototype

    {{ model_json|indent(4) }}
