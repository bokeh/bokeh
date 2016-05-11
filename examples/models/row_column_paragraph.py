from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import Row, Column, Paragraph
from bokeh.resources import INLINE
from bokeh.util.browser import view

layout = Column(
    Row(Column(Paragraph(text="Para 1")), Column(Paragraph(text="Para 2"))),
    Row(Column(Paragraph(text="Para 3")), Column(Paragraph(text="Para 4"))),
    Row(Paragraph(text="Para 5")),
    Row(Column(Paragraph(text="Para 6")), Column(Paragraph(text="Para 7"))),
)

doc = Document()
doc.add_root(layout)

if __name__ == "__main__":
    filename = "row_column_paragraph.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Rows and columns of paragraphs."))
    print("Wrote %s" % filename)
    view(filename)
