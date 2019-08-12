{% for setting in settings %}

.. data:: {{ setting['name'] }}
    :annotation:

    * **Type**: {{ setting['type'] }}
    * **Env var**: ``{{ setting['env_var'] }}``
    * **Default**: {{ setting['default'] }}
    * **Dev Default**: {{ setting['dev_default'] }}

    {{ setting['help']|indent(4) }}

{% endfor %}
