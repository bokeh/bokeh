.. attribute:: {{ name }}
    :module: {{ module }}
    :annotation: = {{ default }}

    :Type: {{ type_info }}
    {% if doc %}

    {{ doc|indent(4) }}
    {% endif %}
