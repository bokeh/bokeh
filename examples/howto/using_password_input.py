""" This example using a PasswordInput is purely for demonstration.

Putting a plaintext password ``CustomJS`` code as done here would expose the
password and is not advised in practice!
"""

from bokeh.layouts import column, row
from bokeh.models import Button, CustomJS, PasswordInput, PreText, TextInput
from bokeh.plotting import output_file, show

output_file("using_password_input.html", title="Password Field")

USER = "Jane"
PASSWD = "Bok3h"

text = PreText(text="LOGIN TO KNOW THE SECRET:")
user = TextInput(placeholder="username", title=f"(UserName: {USER})")
password = PasswordInput(placeholder="password", title=f"(Password: {PASSWD})")
button = Button(label="GO!", width=150)

secret = PreText() # Secret information displayed if correct password entered

# Verify if the password typed is bokeh using a JS script
verify = CustomJS(args=dict(user=user, password=password, secret=secret), code="""
    secret.text = 'Wrong Password.';
    if (user.value == %r && password.value == %r) {
        secret.text = 'Correct Password. The Secret is 42.';
    }
""" % (USER, PASSWD))

password.js_on_change('value', verify)
button.js_on_click(verify)

layout = row(column(text, user, password, button), secret)

show(layout)
