:orphan:

.. index::
   single: examples; {{ filename }}

{{ filename }}
{{ '-' * filename|length }}

{% if docstring %}
{{ docstring }}
{% endif %}

.. raw:: html

    {{ script|indent(4) }}

----

.. code-block:: python

    {{ source|indent(4) }}
