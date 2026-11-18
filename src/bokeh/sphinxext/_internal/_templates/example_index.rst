{% for entry in entries %}
.. container:: bk-example-entry

    .. container:: bk-example-heading

        :{{ entry.role }}:`{{ entry.title }} <{{ entry.target }}>`

        .. container:: bk-example-facets

            .. container:: bk-example-topic

                {{ entry.topic }}

            .. container:: bk-example-type

                {{ entry.example_type }}

{% if entry.summary %}
    .. container:: bk-example-summary

        {{ entry.summary }}

{% endif %}
    .. container:: bk-example-details

{% if entry.remaining_summary %}
        {{ entry.remaining_summary }}

{% endif %}
{% for label, value in entry.details %}
        **{{ label }}:** {{ value }}

{% endfor %}
        :bokeh-tree:`{{ entry.filename }}`

{% endfor %}
