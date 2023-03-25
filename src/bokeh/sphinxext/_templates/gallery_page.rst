.. raw:: html

    <div class="bk-gallery">
    {% for opt in opts %}
    <div class="bk-thumbnail">
    <a {% if opt['target'] -%} target="{{ opt['target'] }}" {%- endif %} href="{{ opt['url'] }}">
    <img class="gallery" width="300" height="300"
         src="../_images/{{ opt['img'] }}.png"
         srcset="../_images/{{ opt['img'] }}.png, ../_images/{{ opt['img'] }}@2x.png 2x"
         alt="{{ opt['alt'] }}"
    >
    </a>
    <div class="bk-thumbnail-title">{{ opt['title'] }}</div>
    {% if opt['desc'] -%}
    <div class="bk-thumbnail-description">{{ opt['desc'] }}</div>
    {%- endif %}
    </div>
    {% endfor %}
    </div>
