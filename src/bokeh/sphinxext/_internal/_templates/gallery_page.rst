.. raw:: html

    {% for group in groups %}
    <div class="bk-gallery-group">
    {% if group.title %}<h2>{{ group.title | e }}</h2>{% endif %}
    <ul class="bk-gallery list-unstyled">
    {% for card in group.cards %}
    <li class="bk-thumbnail">
    <a {% if card.target -%} target="{{ card.target | e }}" {%- endif %} href="{{ card.url | e }}">
    <img class="img-fluid" width="300" height="300"
         src="../_images/{{ card.img | e }}.png"
         srcset="../_images/{{ card.img | e }}.png, ../_images/{{ card.img | e }}@2x.png 2x"
         alt="{{ card.alt | e }}" loading="lazy"
    >
    <span class="bk-thumbnail-title">{{ card.title | e }}</span>
    </a>
{% if card.desc and card.parse_desc %}

.. container:: bk-thumbnail-description

    {{ card.desc }}

.. raw:: html

{% elif card.desc %}
    <div class="bk-thumbnail-description">{{ card.desc | safe }}</div>
{% endif %}
    </li>
    {% endfor %}
    </ul>
    </div>
    {% endfor %}
