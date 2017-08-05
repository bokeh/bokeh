Options
-------

{% for opt in opts %}
{{ opt['name'] }}
    *type*: {{ opt['type'] }}
    {% if opt['default'] %} default: {{ opt['default']}} {% endif %}

    {{ opt['doc']|indent(4) }}

{% endfor %}
