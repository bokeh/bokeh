{% for setting in settings %}

``{{ setting['name'] }}``
{{ "''''" +  "'" * setting['name']|length }}

:**Type**: {{ setting['type'] }}
:**Env var**: ``{{ setting['env_var'] }}``
:**Default**: {{ setting['default'] }}
:**Dev Default**: {{ setting['dev_default'] }}

{{ setting['help'] }}

{% endfor %}
