``line_color``
    color to use to stroke lines with

``line_width``
    line stroke width in units of pixels

``line_alpha``
    floating point between 0 (transparent) and 1 (opaque)

``line_join``
    how path segments should be joined together

    - ``'miter'`` |miter_join|
    - ``'round'`` |round_join|
    - ``'bevel'`` |bevel_join|

``line_cap``
    how path segments should be terminated

    - ``'butt'`` |butt_cap|
    - ``'round'`` |round_cap|
    - ``'square'`` |square_cap|

``line_dash``
    a line style to use

    - ``'solid'``
    - ``'dashed'``
    - ``'dotted'``
    - ``'dotdash'``
    - ``'dashdot'``
    - an array of integer pixel distances that describe the on-off pattern of dashing to use
    - a string of spaced integers matching the regular expression ``'^(\\d+(\\s+\\d+)*)?$'``
      that describe the on-off pattern of dashing to use

``line_dash_offset``
    the distance in pixels into the ``line_dash`` that the pattern should start from

.. |miter_join| image:: /_images/miter_join.png
   :height: 15
.. |round_join| image:: /_images/round_join.png
   :height: 15
.. |bevel_join| image:: /_images/bevel_join.png
   :height: 15

.. |butt_cap| image:: /_images/butt_cap.png
   :height: 25
.. |round_cap| image:: /_images/round_cap.png
   :height: 25
.. |square_cap| image:: /_images/square_cap.png
   :height: 25
