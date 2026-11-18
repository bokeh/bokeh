''' Mask characters typed into a password field.

.. bokeh-example-metadata::
    :title: Passwordinput
    :keywords: password, input
    :apis: bokeh.models.CustomJS, bokeh.models.PasswordInput
'''

from bokeh.io import show
from bokeh.models import CustomJS, PasswordInput

password_input = PasswordInput(placeholder="enter password...")
password_input.js_on_change("value", CustomJS(code="""
    console.log('password_input: value=' + this.value, this.toString())
"""))

show(password_input)
