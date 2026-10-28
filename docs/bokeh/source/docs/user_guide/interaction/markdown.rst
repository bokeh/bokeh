.. _ug_interaction_markdown:

Markdown
========

Use :class:`~bokeh.models.Markdown` to display formatted text alongside plots
and widgets. BokehJS parses the Markdown, highlights code, and renders math in
the browser. Changing ``text`` updates the displayed content in standalone
JavaScript callbacks or Python callbacks in a Bokeh server application.

.. bokeh-plot::
    :source-position: below

    from bokeh.io import show
    from bokeh.models import Markdown

    content = Markdown(text="""
        # Results

        Display **bold text**, *emphasis*, and `inline code`.

        - Prepare the data
        - Build a plot
        - Share the results
    """, sizing_mode="stretch_width", max_width=700)
    show(content)

See :bokeh-tree:`examples/interaction/widgets/markdown.py` and its sibling
:bokeh-tree:`examples/interaction/widgets/markdown.md` for a complete example.

Formatting and extensions
-------------------------

Markdown supports headings, paragraphs, ordered and unordered lists, links,
images, blockquotes, horizontal rules, fenced code blocks, tables, task lists,
and strikethrough. Reference-style links and nested lists are also supported.
For example:

.. code-block:: markdown

    ## Progress

    - [x] Prepare the data
    - [ ] Share the results

    | Series | Count |
    | ------ | ----: |
    | A      |   120 |

    See the [Bokeh documentation](https://docs.bokeh.org/).

Add a language name after the opening code fence, such as ``python`` or
``javascript``, to highlight code. Highlighting uses Highlight.js's common
language set in BokehJS. Unknown languages and fences without a language name
remain plain text.

For inline math, escape the backslash delimiters so Markdown preserves them
for MathJax. Display math can use double dollar signs:

.. code-block:: markdown

    Inline math: \\(E = mc^2\\).

    $$
    \int_0^1 x^2 dx = \frac{1}{3}
    $$

Set ``disable_math=True`` to leave math delimiters as literal text. Math and
other extensions inside code spans and fenced code blocks remain literal.

Several additional extensions are available:

.. code-block:: markdown

    ## Stable heading {#results}

    [Jump to the results](#results).

    A result with supporting details[^note].

    [^note]: Footnotes appear at the end of this widget's content.

    > [!NOTE]
    > Callouts can contain **formatted text** and lists.

    Glyph
    : A visual mark such as a line or circle.
    : A glyph displays values from a data source.

    <details>
    <summary>More information</summary>

    This section contains **Markdown** and can be expanded or collapsed.

    </details>

Callouts support ``NOTE``, ``TIP``, ``IMPORTANT``, ``WARNING``, and ``CAUTION``.
Definition lists support multiple definitions and indented continuation
paragraphs. Keep blank lines between ``<details>`` / ``<summary>`` tags and
Markdown content.

Headings receive generated IDs and permalink links. Repeated headings receive
numeric suffixes. Explicit Markdown IDs use ``{#name}``, starting with a letter
and containing letters, digits, underscores, or hyphens. Unique explicit IDs
are reserved before suffixes are allocated. Colliding explicit IDs receive
suffixes to avoid other headings, HTML anchors, and footnote targets in the
same widget. Use stable, unique explicit IDs for links you intend to share.

Raw HTML is sanitized. Internal embed and heading markers supplied through raw
HTML are ignored. Use the documented Markdown syntax for these extensions.

Rendering options
-----------------

Each option applies to the entire widget. To display content with different
options on one page, create separate Markdown widgets and arrange them in a
layout.

* ``dedent=True`` removes common leading whitespace from nonblank lines before
  parsing. This makes indented Python multiline strings convenient. Relative
  indentation, including indented code blocks, is preserved. Set
  ``dedent=False`` when the original indentation should be interpreted
  literally.
* ``hard_line_break=False`` treats a single newline in a paragraph as a soft
  line break. Set ``hard_line_break=True`` to display it as a hard line break.
  Code blocks retain their line breaks with either setting.
* ``disable_anchors=False`` adds generated heading IDs and permalink links.
  Set ``disable_anchors=True`` to omit them. Explicit Markdown and HTML IDs,
  and footnote navigation, remain available.

For example, this widget preserves four leading spaces, so its text is an
indented code block:

.. code-block:: python

    literal = Markdown(text="    print('hello')", dedent=False)

Embedding plots and widgets
---------------------------

Place ``::bokeh[name]`` on its own line to insert a model from the widget's
``embeds`` mapping. This is a block between paragraphs, rather than an object
that flows within a line of text. The mapping accepts plots, widgets, and
layouts:

.. bokeh-plot::
    :source-position: below

    from bokeh.io import show
    from bokeh.models import Markdown
    from bokeh.plotting import figure

    trend = figure(height=200, sizing_mode="stretch_width")
    trend.line([1, 2, 3], [2, 5, 4])

    report = Markdown(
        text="## Trend\n\n::bokeh[trend]\n\nThe latest observations.",
        embeds={"trend": trend},
        sizing_mode="stretch_width",
        max_width=700,
    )
    show(report)

Names must be nonempty and contain only ASCII letters, digits, underscores,
periods, or hyphens. Each model can appear once within a widget, even when
multiple names refer to it. Models not referenced by the text do not create
views. Missing names, repeated models, recursive embeds, and failed view
initialization display messages in the corresponding slots. A later text or
mapping update can retry a failed build.

Embedded models retain their views and state when surrounding text changes.
They use their own sizing properties within the available space. A Markdown
widget with embeds fills the width its enclosing container provides by
default. A content-sized row or column may provide only the width needed by
its contents. Set ``sizing_mode="stretch_width"`` on the enclosing layout when
it should fill the available page width.

Explicit width and sizing policies on the Markdown widget take precedence.
Use ``max_width`` to cap the text width, and ``sizing_mode="stretch_width"`` on
plots that should follow it. Wide code blocks can scroll horizontally. Custom
styles can control image sizes and table overflow through the widget's
``stylesheets`` property.

Python object representations
-----------------------------

In Python, ``text`` also accepts objects with a callable ``_repr_markdown_()``
method:

.. bokeh-plot::
    :source-position: below

    from bokeh.io import show
    from bokeh.models import Markdown

    class Results:
        def __init__(self, count):
            self.count = count

        def _repr_markdown_(self):
            return f"## Results\n\n**Count:** {self.count}"

    results = Results(120)
    summary = Markdown(text=results)
    results.count = 150
    summary.text = results  # Refresh the displayed snapshot.
    show(summary)

The method runs once on construction or assignment. It can return a string,
a ``(string, metadata)`` tuple, or ``None``. Metadata must be a mapping and is
ignored. Direct strings are accepted as usual. Passing ``None`` directly or
returning it from the method produces empty content.

The stored ``text`` is a string snapshot. Mutating the original object does
not update the widget until you reassign it. Metadata does not configure
embeds or rendering options. Supply those properties on the Markdown widget.
