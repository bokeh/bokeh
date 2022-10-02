.. raw:: html

    <ul class="gallery clearfix simple">
    {% for opt in opts %}
    <li>
    <a href="{{ opt['ref'] }}">
    <img class="gallery" width="300" height="300"
         src="../_images/{{ opt['img'] }}.png"
         srcset="../_images/{{ opt['img'] }}.png, ../_images/{{ opt['img'] }}@2x.png 2x"
         {% if opt['alt'] -%}
         alt="{{ opt['alt'] }}"
         {%- endif %}
    >
    </a>
    </li>
    {% endfor %}
    </ul>
