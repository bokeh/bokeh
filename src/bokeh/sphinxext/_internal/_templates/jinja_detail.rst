.. data:: {{ name }}
    :module: {{ module }}
    :annotation: = {{ objrepr }}
    {% if noindex %}:noindex:{% endif %}

    {% if doc %}{{ doc|indent(4) }}{% endif %}

    .. dropdown:: Template: {{ filename }}
        :animate: fade-in

        .. code-block:: jinja

            {{ template_text|indent(12) }}
