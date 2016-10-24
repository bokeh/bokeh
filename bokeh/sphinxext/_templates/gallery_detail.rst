:orphan:

.. _gallery_{{ name }}:

{{ name }}
{{ underline }}

{% if prev_ref -%} < :ref:`{{ prev_ref }}` | {% endif %}
back to :ref:`{{ up_ref }}`
{%- if next_ref %} | :ref:`{{ next_ref }}` >{% endif %}

.. bokeh-plot:: {{ path }} {%- if symbol %} {{ symbol }} {% endif %}
   {% if source_position -%}:source-position: {{ source_position }} {% endif %}
