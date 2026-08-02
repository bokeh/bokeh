.. autoclass:: {{ module_name }}.{{ name }}
    :show-inheritance:

{% if property_names %}
.. list-table:: Property index
    :class: bokeh-property-index
    :widths: 25 25 25 25

{% for row in property_names|batch(4, "") %}
    * - {% if row[0] %}:attr:`~{{ module_name }}.{{ name }}.{{ row[0] }}`{% endif %}
      - {% if row[1] %}:attr:`~{{ module_name }}.{{ name }}.{{ row[1] }}`{% endif %}
      - {% if row[2] %}:attr:`~{{ module_name }}.{{ name }}.{{ row[2] }}`{% endif %}
      - {% if row[3] %}:attr:`~{{ module_name }}.{{ name }}.{{ row[3] }}`{% endif %}
{% endfor %}
{% endif %}
Properties
----------

{% for detail in property_details %}
{{ detail }}
{% endfor %}
{% for property in python_properties %}
.. autoproperty:: {{ module_name }}.{{ name }}.{{ property }}

{% endfor %}
Methods
-------

{% for method in methods %}
.. automethod:: {{ module_name }}.{{ name }}.{{ method }}

{% endfor %}
.. dropdown:: JSON Prototype
    :animate: fade-in

    .. code-block:: javascript

        {{ model_json|indent(8) }}
