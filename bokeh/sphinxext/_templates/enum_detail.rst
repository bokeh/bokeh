.. data:: {{ name }}
    :module: {{ module }}
    :annotation: = {{ shortrepr }}
    {% if noindex %}:noindex:{% endif %}

    {% for line in content %}
    {{ line }}
    {% endfor %}

    {% if fullrepr %}

    .. collapsible-code-block:: python
        :heading: See all values

        {% for line in fullrepr %}
        {{ line|indent(8) }}
        {% endfor %}

    {% endif %}
