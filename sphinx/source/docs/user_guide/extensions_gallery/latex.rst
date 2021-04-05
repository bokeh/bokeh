.. _userguide_extensions_examples_latex:

Creating LaTeX labels
---------------------

This example shows how to create a custom ``LatexLabel`` class that uses a
third-party JavaScript library, `KaTeX`_, to render LaTeX onto the
plot.

.. bokeh-plot:: docs/user_guide/examples/extensions_example_latex.py
    :source-position: below

.. seealso::
    Extended examples of using `KaTeX`_ LaTeX with Bokeh labels are available
    in :bokeh-tree:`examples/custom/wrapped_extension_base/` and
    :bokeh-tree:`examples/custom/wrapped_extension_full/`.

    A similar example using `MathJax`_ to render LaTeX in a Bokeh label is
    available in
    :bokeh-tree:`examples/models/file/latex_extension_mathjax.py`

.. _KaTeX: https://khan.github.io/KaTeX/
.. _MathJax: https://www.mathjax.org/
