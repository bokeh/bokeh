"""This example using a PasswordInput is purely for demonstration.

Putting a password plaintext in a CustomJS is not advised since it would expose the password.
"""

from bokeh.models.widgets import PasswordInput, TextInput, PreText, Button
from bokeh.layouts import column, row
from bokeh.plotting import show, output_file
from bokeh.models.callbacks import CustomJS

USER = "Mau"
PASSWD = "Bok3h"

text = PreText(text="LOGIN TO KNOW\nTHE SECRET:")
user = TextInput(placeholder="username", title="(UserName: "+USER+")")
pwd = PasswordInput(placeholder="password", title="(Password: "+PASSWD+")")
btn = Button(label="GO!",width=150)

secret = PreText() # Secret information displayed if correct password entered

## Verify if the password typed is bokeh using a JS script
verify_pwd = CustomJS(args=dict(user=user, pwd=pwd, secret=secret), code="""
    secret.text = 'Wrong Password.';
    if ( user.value == %r && pwd.value == %r) {
        secret.text = 'Right Password. The Secret is 42.';
    }
""" % (USER, PASSWD))

#user.callback = verify_pwd # Check password pressing enter.
pwd.callback = verify_pwd # Check password pressing enter.
btn.callback = verify_pwd # Check password clicking on the Button.

output_file("using_password_input.html", title="Password Field")
page = row(column(text,user, pwd,btn),secret)
show(page)
