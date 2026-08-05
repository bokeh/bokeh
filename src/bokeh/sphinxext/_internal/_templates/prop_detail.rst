.. attribute:: {{ name }}
    :module: {{ module }}
    :annotation: = {{ default }}

    {% if type_lines|length == 1 %}
    :Type: {{ type_lines[0] }}
    {% else %}
    :Type:
{{ "        | " + type_lines|join("\n        | ") }}
    {% endif %}
    {% if doc %}

    {{ doc|indent(4) }}
    {% endif %}
