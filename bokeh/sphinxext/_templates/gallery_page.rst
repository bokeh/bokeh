{% for opt in opts %}
* |{{ opt['name'] }}|
{% endfor %}

{% for opt in opts %}
.. |{{ opt['name'] }}| image:: /_images/gallery/{{ opt['name'] }}.png
    :target: {{ opt['ref'] }}
    :class: gallery
    {% if opt['alt'] -%}
    :alt: {{ opt['alt'] }}
    {%- endif %}
{% endfor %}
