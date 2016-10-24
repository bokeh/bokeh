.. data:: {{ name }}
    :module: {{ module }}
    :annotation: = {{ objrepr }}

    {% if doc %}{{ doc|indent(4) }}{% endif %}

    .. collapsible-code-block:: {{ lang }}
        :heading: Template: {{ filename }}

        {{ template_text|indent(8) }}
