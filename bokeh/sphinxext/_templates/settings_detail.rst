{% for setting in settings %}

.. data:: {{ setting['_name'] }}
    :annotation: = {{ setting['_env_var'] }}

{{ setting['_help']|indent(4) }}

{% endfor %}


. autoclass:: {{ module_name }}.Settings
    :members:
