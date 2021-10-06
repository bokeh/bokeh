from bokeh.models import HTMLLabel


class LatexLabel(HTMLLabel):
    """A subclass of `Label` with all of the same class attributes except
    canvas mode isn't supported and DOM manipulation happens in the TypeScript
    superclass implementation that requires setting).

    Only the render method of LabelView is overwritten to perform the
    text -> latex (via katex) conversion.
    """

    __javascript__ = ["https://unpkg.com/katex@0.11.1/dist/katex.min.js"]
    __css__ = ["https://unpkg.com/katex@0.11.1/dist/katex.min.css"]
