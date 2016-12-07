.. data:: {{ name }}
    :module: {{ module }}
    :annotation: = {{ objrepr }}

    {% if doc %}{{ doc|indent(4) }}{% endif %}

    .. collapsible-code-block:: jinja
        :heading: Template: {{ filename }}

        {{ template_text|indent(8) }}
