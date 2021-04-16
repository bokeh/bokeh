{{ name }}
{{ "~" * name|length }}

.. autoclass::  {{ module_name }}.{{ name }}
    :members:
    :show-inheritance:
    :inherited-members:

    .. _{{ name }}.json:

    .. collapsible-code-block:: javascript
        :heading: JSON Prototype

        {{ model_json|indent(8) }}

    .. autoclasstoc::
