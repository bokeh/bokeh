from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import Row, Column, Paragraph
from bokeh.resources import INLINE
from bokeh.util.browser import view

text = """
Bacon ipsum dolor amet hamburger brisket prosciutto, pork ball tip andouille
sausage landjaeger filet mignon ribeye ground round. Jerky fatback cupim
landjaeger meatball pork loin corned beef, frankfurter short ribs short loin
bresaola capicola chuck kevin. Andouille biltong turkey, tail t-bone ribeye
short loin tongue prosciutto kielbasa short ribs boudin. Swine beef ribs
tri-tip filet mignon bresaola boudin beef meatball venison leberkas fatback
strip steak landjaeger drumstick prosciutto.
"""

layout = Column(
    Row(Column(Paragraph(text=text)), Column(Paragraph(text=text))),
    Row(Column(Paragraph(text=text)), Column(Paragraph(text=text))),
    Row(Paragraph(text=text)),
    Row(Column(Paragraph(text=text)), Column(Paragraph(text=text))),
)

doc = Document()
doc.add_root(layout)

if __name__ == "__main__":
    filename = "row_column_paragraph.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Rows and columns of paragraphs."))
    print("Wrote %s" % filename)
    view(filename)
