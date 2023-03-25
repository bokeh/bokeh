from datetime import date

from bokeh.layouts import column
from bokeh.models import (AutocompleteInput, Button, CheckboxButtonGroup,
                          DatePicker, Dropdown, RadioButtonGroup, TextInput, Toggle)
from bokeh.plotting import save

menu = [("Item 1", "1"), ("Item 2", "2"), ("Item 3", "3")]

layout = column(
    Button(label="Default Button 1", button_type="default"),
    Button(label="Primary Button 2", button_type="primary"),
    Button(label="Success Button 3", button_type="success"),

    Toggle(label="Default Toggle 1", button_type="default"),
    Toggle(label="Primary Toggle 2", button_type="primary"),
    Toggle(label="Success Toggle 3", button_type="success"),

    Dropdown(label="Default Dropdown 1", button_type="default", menu=menu),
    Dropdown(label="Primary Dropdown 2", button_type="primary", menu=menu),
    Dropdown(label="Success Dropdown 3", button_type="success", menu=menu),

    CheckboxButtonGroup(labels=["Checkbox Option 1", "Checkbox Option 2", "Checkbox Option 3"], button_type="default", active=[0, 1]),
    CheckboxButtonGroup(labels=["Checkbox Option 4", "Checkbox Option 5", "Checkbox Option 6"], button_type="primary", active=[1, 2]),
    CheckboxButtonGroup(labels=["Checkbox Option 7", "Checkbox Option 8", "Checkbox Option 9"], button_type="success", active=[0, 2]),

    RadioButtonGroup(labels=["Radio Option 1", "Radio Option 2", "Radio Option 3"], button_type="default", active=0),
    RadioButtonGroup(labels=["Radio Option 4", "Radio Option 5", "Radio Option 6"], button_type="primary", active=1),
    RadioButtonGroup(labels=["Radio Option 7", "Radio Option 8", "Radio Option 9"], button_type="success", active=2),

    TextInput(placeholder="TextInput 1"),
    TextInput(placeholder="TextInput 2"),
    TextInput(placeholder="TextInput 3"),

    AutocompleteInput(placeholder="AutocompleteInput 1 ...", completions=["aaa", "aab", "aac", "baa", "caa"]),
    AutocompleteInput(placeholder="AutocompleteInput 2 ...", completions=["AAA", "AAB", "AAC", "BAA", "CAA"]),
    AutocompleteInput(placeholder="AutocompleteInput 3 ...", completions=["000", "001", "002", "100", "200"]),

    DatePicker(value=date(2018, 9, 1)),
    DatePicker(value=date(2018, 9, 2)),
    DatePicker(value=date(2018, 9, 3)),
)

    #Slider(value=10, start=0, end=100, step=0.5),
    #RangeSlider(value=[20, 30], start=0, end=100, step=0.5),
    #DateSlider(value=date(2018, 9, 1), start=date(2018, 1, 1), end=date(2018, 12, 31)),
    #DateRangeSlider(value=(date(2018, 9, 1), date(2018, 9, 30)), start=date(2018, 1, 1), end=date(2018, 12, 31)),

    #CheckboxGroup(labels=["Checkbox Option 1", "Checkbox Option 2", "Checkbox Option 3"], active=[0, 1]),
    #CheckboxGroup(labels=["Checkbox Option 4", "Checkbox Option 5", "Checkbox Option 6"], active=[1, 2]),
    #CheckboxGroup(labels=["Checkbox Option 7", "Checkbox Option 8", "Checkbox Option 9"], active=[0, 2]),

    #CheckboxGroup(labels=["Checkbox Option 1", "Checkbox Option 2", "Checkbox Option 3"], active=[0, 1], inline=True),
    #CheckboxGroup(labels=["Checkbox Option 4", "Checkbox Option 5", "Checkbox Option 6"], active=[1, 2], inline=True),
    #CheckboxGroup(labels=["Checkbox Option 7", "Checkbox Option 8", "Checkbox Option 9"], active=[0, 2], inline=True),

    #RadioGroup(labels=["Radio Option 1", "Radio Option 2", "Radio Option 3"], active=0),
    #RadioGroup(labels=["Radio Option 4", "Radio Option 5", "Radio Option 6"], active=1),
    #RadioGroup(labels=["Radio Option 7", "Radio Option 8", "Radio Option 9"], active=2),

    #RadioGroup(labels=["Radio Option 1", "Radio Option 2", "Radio Option 3"], active=0, inline=True),
    #RadioGroup(labels=["Radio Option 4", "Radio Option 5", "Radio Option 6"], active=1, inline=True),
    #RadioGroup(labels=["Radio Option 7", "Radio Option 8", "Radio Option 9"], active=2, inline=True),

    #Select(options=["Select Option 1", "Select Option 2", "Select Option 3"]),
    #MultiSelect(options=[f"MultiSelect Option {i+1}" for i in range(16)], size=6),

    #Paragraph(text="Paragraph 1"),
    #Paragraph(text="Paragraph 2"),
    #Paragraph(text="Paragraph 3"),

    #Div(text="Div 1"),
    #Div(text="Div 2"),
    #Div(text="Div 3"),

    #PreText(text="PreText 1"),
    #PreText(text="PreText 2"),
    #PreText(text="PreText 3"),

save(layout)
