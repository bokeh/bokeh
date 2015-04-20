from bokeh.document import Document
from bokeh.session import Session
from bokeh.plotting import figure

document = Document()
session = Session()

session.use_doc('test_document')
session.load_document(document)

x = [1, 2, 3, 4, 5, 6, 7]
y = [5, 5, 7, 7, 8, 8, 9]

p = figure(title="simple line server example")
p.line(x, y, x_axis_label='x', y_axis_label='y')

document.add(p)
session.store_document(document)

link = session.object_link(document.context)
print("URL of this document: {}".format(link))
