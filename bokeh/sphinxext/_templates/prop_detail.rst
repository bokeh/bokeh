.. attribute:: {{ name }}
    :module: {{ module }}

    :property type: {{ type_info }}

    :default value: ``{{ default }}``

    {% if doc %}{{ doc|indent(4) }}{% endif %}
