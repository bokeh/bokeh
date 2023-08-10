:Keyword Arguments:
{% for opt in opts %}
    - {{ opt['name'] }} ({{ opt['type'] }}): {{ opt['doc']|indent(8) }} (default: {{ opt['default']}})
{% endfor %}
