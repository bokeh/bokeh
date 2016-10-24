:orphan:

.. index::
   single: examples; {{ filename }}

{{ filename }}
{{ '-' * filename|length }}

{% if docstring %}
{{ docstring }}
{% endif %}

.. code-block:: python

    {{ source|indent(4) }}

----

.. raw:: html

    {{ script|indent(4) }}