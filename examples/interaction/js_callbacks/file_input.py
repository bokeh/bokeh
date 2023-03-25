from bokeh.layouts import column
from bokeh.models import CustomJS, Div, FileInput
from bokeh.plotting import show

file_input = FileInput(title="Select files:", accept=".csv,.json")
div = Div(text="<h1>FileInput Values:</h1><p>filename:<p>base64 value:")

callback = CustomJS(args=dict(div=div, file_input=file_input), code="""
    div.text = "<h1>FileInput Values:</h1><p>filename: " + file_input.filename
               + "<p>b64 value: " + file_input.value
""")

file_input.js_on_change('filename', callback)

show(column(file_input, div))
