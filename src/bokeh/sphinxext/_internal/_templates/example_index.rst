{% for entry in entries %}
.. container:: bk-example-entry

{% if entry.thumbnail %}
    .. raw:: html

        <img class="bk-example-thumbnail" width="88" height="88"
             src="../_images/{{ entry.thumbnail | e }}"
             alt="" loading="lazy">

{% endif %}
    .. container:: bk-example-heading

        {{ entry.title }}

        .. container:: bk-example-facets

{% for topic in entry.topics %}
            .. container:: bk-example-topic

                {{ topic }}

{% endfor %}
            .. container:: bk-example-type

                {{ entry.example_type }}

{% if entry.summary %}
    .. container:: bk-example-summary

        {{ entry.summary }}

{% endif %}
    .. container:: bk-example-links

        :bokeh-tree:`View source <{{ entry.filename }}>`

{% if entry.role %}
        :{{ entry.role }}:`View example <{{ entry.target }}>`

{% endif %}
{% if entry.remaining_summary or entry.details %}
    .. container:: bk-example-details

{% if entry.remaining_summary %}
        {{ entry.remaining_summary }}

{% endif %}
{% for label, value in entry.details %}
        **{{ label }}:** {{ value }}

{% endfor %}
{% endif %}
{% endfor %}
