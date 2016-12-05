{% for name in names %}
* |{{ name }}|
{% endfor %}

{% for name in names %}
.. |{{ name }}| image:: /_images/gallery/{{ name }}.png
    :target: gallery/{{ name }}.html
    :class: gallery
{% endfor %}
