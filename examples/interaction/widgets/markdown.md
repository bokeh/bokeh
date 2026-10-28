# Markdown in Bokeh

Display **bold text**, *italic text*, and `inline code` in a widget.
Use ~~strikethrough~~ to mark text as removed.

## Jump to a section

Headings automatically get anchors. Hover over a heading or focus its `#`
link to find its permalink.

- [Lists and links](#lists-and-links)
- [Code blocks](#code-blocks)
- [Math](#math)
- [Footnote examples](#footnote-examples)
- [Admonitions](#admonitions)
- [Collapsible sections](#collapsible-sections)
- [Definition lists](#definition-lists)
- [A heading with a stable ID](#stable-heading)
- [Embedded plot](#embedded-plot)
- [Rendering options](#rendering-options-demo)
- [Python object representations](#object-representations)

## Lists and links

- Create interactive plots
- Arrange plots and widgets in layouts
    - Rows and columns
    - Tabs and grids
- Share your results

1. Prepare your data
2. Build a plot
3. Call `show()`

Visit the [Bokeh documentation](https://docs.bokeh.org/en/latest/) or
explore the [gallery](https://docs.bokeh.org/en/latest/docs/gallery.html).

Reference-style links keep repeated URLs out of the prose:
read the [user guide][guide] and revisit the [guide][guide] later.
Bare URLs become links too: https://bokeh.org.

[guide]: https://docs.bokeh.org/en/latest/docs/user_guide.html "Bokeh user guide"

### Task lists

- [x] Prepare the data
- [x] Build a plot
- [ ] Share the results

## Quotes and separators

> Bokeh combines plots and widgets in interactive documents.
>
> A blockquote can contain **formatting** and multiple paragraphs.

The horizontal rule below separates sections.

---

## Images

![Bokeh logotype](https://static.bokeh.org/branding/logos/bokeh-logo.svg "Bokeh")

## Line breaks and literal characters

A backslash at the end of a line creates a hard line break:\
this line stays in the same paragraph.

Escape punctuation to display literal syntax: \*not italic\*,
\[not a link\], and \# not a heading.

## Tables

| Glyph | Method | Use |
| :--- | :--- | :--- |
| Line | `p.line()` | Connected observations |
| Scatter | `p.scatter()` | Individual observations |
| Vertical bar | `p.vbar()` | Category comparisons |

## Code blocks

Specify a language after the opening fence to highlight code in the browser.

```python
from bokeh.plotting import figure, show

p = figure(title="A simple line", width=400, height=250)
p.line([1, 2, 3], [1, 4, 9], line_width=2)
show(p)
```

```javascript
// Updating text also updates syntax highlighting.
const message = "Hello from BokehJS"
console.log(message)
```

## Math

Inline math fits into a sentence: \\(E = mc^2\\).

A display equation can occupy its own line:

\\[
\int_0^1 x^2 dx = \frac{1}{3}
\\]

## Admonitions

> [!NOTE]
> Callouts can contain **formatted text**, [links](https://bokeh.org), and lists.
>
> - Keep related guidance together
> - Highlight useful context

> [!TIP]
> Update the widget's `text` to rerender Markdown in the browser.

> [!IMPORTANT]
> Give headings explicit IDs when links must remain stable after a title changes.

> [!WARNING]
> A warning draws attention to something that needs care.

> [!CAUTION]
> A caution highlights a potentially harmful action.

## Collapsible sections

<details>
<summary>Expand for a code example and more details</summary>

Markdown inside a collapsible section supports **formatting**, math
\\(f'(x) = 2x\\), and highlighted code.

```python
def square(x):
    return x**2
```

</details>

## Definition lists

Glyph
: A visual mark such as a **line**, circle, or bar.

Data source
: An object that supplies data to glyphs.
: Multiple renderers can share the same source.

Callback
: Code that responds to a change or user interaction.

    Indented paragraphs can add supporting details to a definition.

## A heading with a stable ID {#stable-heading}

This heading uses `{#stable-heading}`, so its link can remain stable even if
the title changes. [Jump to this heading](#stable-heading).

## Embedded plot

Use `::bokeh[trend]` on its own line to mount a model from the widget's
`embeds` mapping. This is an interactive Bokeh plot: try panning, zooming,
or hovering over its toolbar.

::bokeh[trend]

The plot is a block between paragraphs, and keeps its state when the
surrounding Markdown text changes.

## Footnote examples

Keep supporting details in a footnote[^formatting] without interrupting the
main text. A second note can contain multiple paragraphs[^details].
The same footnote can be referenced again[^formatting].

[^formatting]: Footnotes support **bold text**, `inline code`, and
    [links](https://bokeh.org).

[^details]: This is the first paragraph of a longer note.

    Indent subsequent paragraphs to keep them in the same footnote.
