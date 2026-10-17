.. _ug_styling_mathtext:

Mathematical notation
=====================

Bokeh supports mathematical notations expressed in the LaTeX_ and MathML_ markup
languages with a growing number of elements. Currently, you can use LaTeX
and MathML notations with the following elements:

* :ref:`Axis labels <ug_styling_plots_axes_labels>`
* Tick labels using :class:`~bokeh.models.ScaledTickFormatter`,
  :class:`~bokeh.models.SITickFormatter`, or
  :func:`~bokeh.models.Axis.major_label_overrides`
* :ref:`ug_basic_annotations_titles`
* :ref:`ug_basic_annotations_labels`
* :ref:`ug_basic_annotations_color_bars`
* :ref:`RangeSlider widgets <ug_interaction_widgets_range_slider>`
* :ref:`Slider widgets <ug_interaction_widgets_slider>`
* :ref:`Div widgets <ug_interaction_widgets_div>`
* :ref:`Paragraph widgets <ug_interaction_widgets_paragraph>`

Bokeh uses the MathJax_ library to handle LaTeX and MathML. See the official
`MathJax documentation`_ for more information on MathJax.

.. note::
    Embed resource requirements include ``bokeh-mathjax`` when needed. If a
    fragment uses ``resources="none"``, the host page must load that matching
    BokehJS bundle itself.

LaTeX
-----

To use LaTeX notation, you can pass a string directly to any supported element.
This string needs to begin and end with one of the
`MathJax default delimiters`_. These delimiters are ``$$...$$``,  ``\[...\]``,
and ``\(...\)``. For example: ``r"$$\sin(x)$$"``.

LaTeX on axis labels, titles, and labels
    To use LaTeX notation as an :ref:`axis label <ug_styling_plots_axes_labels>`,
    :ref:`title <ug_basic_annotations_titles>`, or :ref:`label
    <ug_basic_annotations_labels>`, pass a raw string literal beginning and
    ending with `MathJax default delimiters`_ and containing LaTeX notation. For
    example:

    .. bokeh-plot:: __REPO__/examples/styling/mathtext/latex_axis_labels_titles_labels.py
        :source-position: above

LaTeX and tick labels
    To add a LaTeX unit or other repeated decoration to generated tick labels,
    use a :class:`~bokeh.models.ScaledTickFormatter`. Add a
    :class:`~bokeh.models.ScaledTicker` when tick selection also needs a scale
    or offset. The formatter accepts delimited LaTeX strings and combines the
    value, unit, and any fraction into one math expression. Labels therefore
    continue to update as the visible range changes:

    .. bokeh-plot:: __REPO__/examples/styling/mathtext/latex_tick_labels.py
        :source-position: above

    For SI units, :class:`~bokeh.models.SITickFormatter` similarly combines
    the value, engineering prefix, and a LaTeX unit into one expression. It
    can select a prefix from the visible ticks or keep a fixed prefix while
    panning and zooming.

    The formatter's ``origin_label`` supports signed offsets from a symbolic
    origin. For example, an origin of :math:`\overline{x}` and a unit of
    :math:`\sigma` produce labels from :math:`\overline{x}-3\sigma` through
    :math:`\overline{x}+3\sigma`. For labels that cannot be described by a
    shared origin, scale, prefix, or unit, use
    :func:`~bokeh.models.Axis.major_label_overrides`.

    For example, a small set of unrelated special labels can still be supplied
    directly:

    .. code-block:: python

        from math import pi

        p.xaxis.major_label_overrides = {
            0: r"$$0$$",
            pi/2: r"$$\pi/2$$",
            pi: r"$$\pi$$",
        }

LaTeX on RangeSlider and Slider widget titles
    To use LaTeX notation in the title of a :ref:`ug_interaction_widgets_range_slider`
    or :ref:`ug_interaction_widgets_slider` widget, pass a raw string
    literal beginning and ending with `MathJax default delimiters`_ and containing
    LaTeX notation as the ``title`` parameter. For example:

    .. bokeh-plot:: __REPO__/examples/styling/mathtext/latex_slider_widget_title.py
        :source-position: above

LaTeX with div and paragraph widgets
    To include LaTeX notation in the text of a
    :class:`div widget <bokeh.models.Div>` or :class:`paragraph widget
    <bokeh.models.Paragraph>`, use the standard `MathJax default delimiters`_
    anywhere within your string:

    .. bokeh-plot:: __REPO__/examples/styling/mathtext/latex_div_widget.py
        :source-position: above

    To disable LaTeX rendering for a div or paragraph widget, set the widget's
    ``disable_math`` property to True.

You can use some of Bokeh's standard |text properties| to change the appearance
of rendered math text. Use ``text_font_size`` to change the font size, use
``text_color`` to change the color. For example:

.. code-block:: python

    p.xaxis.axis_label = r"$$\nu \:(10^{15} s^{-1})$$"
    p.xaxis.axis_label_text_color = "green"
    p.xaxis.axis_label_text_font_size = "50px"

Text color and sizes defined in a :ref:`Bokeh theme
<ug_styling_using_themes>` also work.

Additionally, you have the option to use the `LaTeX extensions included in MathJax`_.
For example, use ``\text{}`` to combine literal text with a math expression. Or
use the `color extension`_ to change the color of the rendered LaTeX notation:
``\color{white} \sin(x)``. Text properties set with a LaTeX extension override
any text properties set elsewhere in your code or in a theme.

.. note::
    There are limitations to how much of LaTeX MathJax supports. See
    `Differences from Actual TeX`_ in the MathJax documentation for more details.

MathML
------

To add mathematical notations written in MathML, use Bokeh's
:class:`~bokeh.models.text.MathML` model directly. This model has a ``text``
property that accepts a string containing MathML. For example:

.. bokeh-plot:: __REPO__/examples/styling/mathtext/mathml_axis_labels.py
    :source-position: above

Similar to LaTeX, you can also use Bokeh's standard |text properties|
``text_font_size`` and ``text_color`` to change font size and color for MathML
notations. For example:

.. code-block:: python

    plot.xaxis.axis_label = MathML(text=mathml)
    plot.xaxis.axis_label_text_color = "green"
    plot.xaxis.axis_label_text_font_size = "50px"

For more information, see :class:`~bokeh.models.text.MathML` in the
|reference guide|.

.. _LaTeX: https://www.latex-project.org/
.. _MathML: https://www.w3.org/Math/
.. _MathJax: https://www.mathjax.org
.. _MathJax documentation: http://docs.mathjax.org/en/latest/
.. _MathJax default delimiters: http://docs.mathjax.org/en/latest/basic/mathematics.html#tex-and-latex-input
.. _Differences from Actual TeX: https://docs.mathjax.org/en/latest/input/tex/differences.html
.. _LaTeX extensions included in MathJax: http://docs.mathjax.org/en/latest/input/tex/extensions/index.html
.. _color extension: http://docs.mathjax.org/en/latest/input/tex/extensions/color.html
