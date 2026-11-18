.. raw:: html

    {% for group in groups %}
    <div class="bk-gallery-group">
    {% if group.title %}<h2>{{ group.title | e }}</h2>{% endif %}
    <ul class="bk-gallery list-unstyled">
    {% for opt in group.cards %}
    <li class="bk-thumbnail">
    <a {% if opt['target'] -%} target="{{ opt['target'] }}" {%- endif %} href="{{ opt['url'] }}">
    <img class="img-fluid" width="300" height="300"
         src="../_images/{{ opt['img'] }}.png"
         srcset="../_images/{{ opt['img'] }}.png, ../_images/{{ opt['img'] }}@2x.png 2x"
         alt="{{ opt['alt'] }}" loading="lazy"
    >
    <span class="bk-thumbnail-title">{{ opt['title'] }}</span>
    </a>
{% if opt['desc'] and opt.get('parse_desc') %}

.. container:: bk-thumbnail-description

    {{ opt['desc'] }}

.. raw:: html

{% elif opt['desc'] %}
    <div class="bk-thumbnail-description">{{ opt['desc'] }}</div>
{% endif %}
    </li>
    {% endfor %}
    </ul>
    </div>
    {% endfor %}
