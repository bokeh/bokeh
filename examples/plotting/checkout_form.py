'''This example shows a sample checkout form created using bokeh widgets.

.. bokeh-example-metadata::
    :apis: bokeh.models.widgets.button, bokeh.models.widgets.checkbox, bokeh.models.widgets.groups, bokeh.models.widgets.inputs
    :refs: :ref:`ug_interaction_widgets`
    :keywords: form, widgets, form, inputs

'''
from bokeh.io import show
from bokeh.layouts import column, row
from bokeh.models.widgets import Button, Checkbox, RadioGroup, Select, TextInput

# Billing address

first_name = TextInput(title="First name")
last_name = TextInput(title="Last name")
username = TextInput(title="Username", placeholder="Username", prefix="@")
email = TextInput(title="E-mail", placeholder="you@example.com")
address = TextInput(title="Address", placeholder="1234 Main St.")
address2 = TextInput(title="Address 2 (Optional)", placeholder="Apartment or suite")
country = Select(title="Country", options=["United States"]) #, placeholder="Choose...")
state = Select(title="State", options=["California"]) #, placeholder="Choose...")
zip =  TextInput(title="Zip")

shipping = Checkbox(label="Shipping address is the same as my billing address")
account = Checkbox(label="Save this information for next time")

# Payment

payment_type = RadioGroup(labels=["Credit card", "Debit card", "PayPal"])

name_on_card = TextInput(title="Name on card", placeholder="Full name as displayed on card")
card_number = TextInput(title="Credit card number")
expiration = TextInput(title="Expiration")
cvv = TextInput(title="CVV")

continue_to_checkout = Button(button_type="primary", label="Continue to checkout", sizing_mode="stretch_width")

form = column([
    # billing_address
    row([first_name, last_name]),
    username,
    email,
    address,
    address2,
    row([country, state, zip]),
    # hr
    shipping,
    account,
    # hr
    # payment
    payment_type,
    row([name_on_card, card_number]),
    row([expiration, cvv]),
    # hr
    continue_to_checkout,
])

show(form)
