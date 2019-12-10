from bokeh.layouts import column
from bokeh.models import CustomJS, Div, FileInput
from bokeh.plotting import output_file, show

# Set up widgets
file_input = FileInput(accept=".csv,.json")
para = Div(text="<h1>FileInput Values:</h1><p>filename:<p>b64 value:")

# Create CustomJS callback to display file_input attributes on change
callback = CustomJS(args=dict(para=para, file_input=file_input), code="""
    para.text = "<h1>FileInput Values:</h1><p>filename: " + file_input.filename  + "<p>b64 value: " + file_input.value
""")

# Attach callback to FileInput widget
file_input.js_on_change('change', callback)


output_file("file_input.html")

show(column(file_input, para))
