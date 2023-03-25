from bokeh.io import show
from bokeh.models import CustomJS, PasswordInput

password_input = PasswordInput(placeholder="enter password...")
password_input.js_on_change("value", CustomJS(code="""
    console.log('password_input: value=' + this.value, this.toString())
"""))

show(password_input)
