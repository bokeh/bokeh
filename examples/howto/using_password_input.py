from bokeh.models.widgets import PasswordInput, TextInput, PreText, Button
from bokeh.layouts import column, row
from bokeh.plotting import show, output_file
from bokeh.models.callbacks import CustomJS
import bokeh

print bokeh.models.widgets.__file__

# Set User and Password:
USER = "Mau"
PASSWD = "Bok3h"

## Create Texts, inputs and button
text = PreText(text="LOGIN TO KNOW\nTHE SECRET:")
user = TextInput(placeholder="username")#, title="(UserName: "+USER+")")
pwd = PasswordInput(placeholder="password")#, title="(Password: "+PASSWD+")")
btn = Button(label="GO!",width=150)

secret = PreText() # Secret information displayed if correct password entered

## Verify if the password typed is bokeh using a JS script
verify_pwd = CustomJS(args=dict(user=user, pwd=pwd, secret=secret),
                      code=""" if (pwd.value == '"""+PASSWD+"""') {
                                    if (user.value == '"""+USER+"""') {
                                     secret.text = 'Right Password. The Secret is 42.';
                                      return;
                                     }
                               }
                               secret.text = "Wrong Password."; """)
#user.callback = verify_pwd # Check password pressing enter. -BUG Works also with tab :(
pwd.callback = verify_pwd # Check password pressing enter.  -BUG Works also with tab :(
btn.callback = verify_pwd # Check password clicking on the Button.

output_file("password.html", title="Password Field")
page = row(column(text,user, pwd,btn),secret)
show(page)
