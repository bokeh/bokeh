.. data:: {{ name }}
    :module: {{ module }}
    :annotation: = {{ shortrepr }}
    {% if noindex %}:noindex:{% endif %}

    {% for line in content %}
    {{ line }}
    {% endfor %}

    {% if fullrepr %}

    .. dropdown:: See all values
        :animate: fade-in

        .. code-block:: python

            {% for line in fullrepr %}
            {{ line|indent(12) }}
            {% endfor %}

    {% endif %}
