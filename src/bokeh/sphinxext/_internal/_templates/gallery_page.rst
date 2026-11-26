{% for group in groups %}
{% if group.title %}
.. raw:: markdown

    #### {{ group.title }}

{% endif %}
.. raw:: html

    <div class="bk-gallery-group">
    {% if group.title %}<h2>{{ group.title | e }}</h2>{% endif %}
    <ul class="bk-gallery list-unstyled">
{% for card in group.cards %}
.. raw:: html

    <li class="bk-thumbnail">
    <a {% if card.target -%} target="{{ card.target | e }}" {%- endif %} href="{{ card.url | e }}">
    <img class="img-fluid" width="300" height="300"
         src="../_images/{{ card.img | e }}.png"
         srcset="../_images/{{ card.img | e }}.png, ../_images/{{ card.img | e }}@2x.png 2x"
         alt="{{ card.alt | e }}" loading="lazy"
    >
    <span class="bk-thumbnail-title">{{ card.title | e }}</span>
    </a>

.. raw:: markdown

    {{ card.markdown }}

{% if card.desc and card.parse_desc %}
.. container:: bk-thumbnail-description

    {{ card.desc }}

{% endif %}
.. raw:: html

{% if card.desc and not card.parse_desc %}
    <div class="bk-thumbnail-description">{{ card.desc | safe }}</div>
{% endif %}
    </li>

{% endfor %}
.. raw:: html

    </ul>
    </div>

{% endfor %}
