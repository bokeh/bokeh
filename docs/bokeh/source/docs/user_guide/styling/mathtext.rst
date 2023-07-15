.. _ug_styling_mathtext:

Mathematical notation
=====================

Bokeh supports mathematical notations expressed in the LaTeX_ and MathML_ markup
languages with a growing number of elements. Currently, you can use LaTeX
and MathML notations with the following elements:

* :ref:`Axis labels <ug_styling_plots_axes_labels>`
* Tick labels using :func:`~bokeh.models.Axis.major_label_overrides`
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
    If you use the |components| function, make sure to include the
    ``bokeh-mathjax-`` resource in your html template.

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
    To add LaTeX notations to your tick labels, use the
    :func:`~bokeh.models.Axis.major_label_overrides` function with an axis.

    This function is used to replace values for existing tick labels with custom
    text. It accepts a dictionary with the tick label's original value as the
    key and your custom value as the dict's value.

    Use this function to replace any plain text tick labels with LaTeX notation:

    .. bokeh-plot:: __REPO__/examples/styling/mathtext/latex_tick_labels.py
        :source-position: above

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
