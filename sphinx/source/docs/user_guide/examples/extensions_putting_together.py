from bokeh.core.properties import String, Instance
from bokeh.models import LayoutDOM, Slider

CODE ="""
import * as _ from "underscore"
import * as $ from "jquery"

import * as p from "core/properties"
import {LayoutDOM, LayoutDOMView} from "models/layouts/layout_dom"

export class CustomView extends LayoutDOMView

  initialize: (options) ->
    super(options)

    @render()

    # Set Backbone listener so that when the Bokeh slider has a change
    # event, we can process the new data
    @listenTo(@model.slider, 'change', () => @render())

  render: () ->
    # Backbone Views create <div> elements by default, accessible as @$el.
    # Many Bokeh views ignore this default <div>, and instead do things
    # like draw to the HTML canvas. In this case though, we change the
    # contents of the <div>, based on the current slider value.
    @$el.html("<h1>#{ @model.text }: #{ @model.slider.value }</h1>")
    @$el.find('h1').css({ 'color': '#686d8e', 'background-color': '#2a3153' })

export class Custom extends LayoutDOM

  # If there is an associated view, this is boilerplate.
  default_view: CustomView

  # The ``type`` class attribute should generally match exactly the name
  # of the corresponding Python class.
  type: "Custom"

  # The @define block adds corresponding "properties" to the JS model. These
  # should basically line up 1-1 with the Python model class. Most property
  # types have counterparts, e.g. bokeh.core.properties.String will be
  # p.String in the JS implementation. Where the JS type system is not yet
  # as rich, you can use p.Any as a "wildcard" property type.
  @define {
    text:   [ p.String ]
    slider: [ p.Any    ]
  }
"""

class Custom(LayoutDOM):

    __implementation__ = CODE

    text = String(default="Custom text")

    slider = Instance(Slider)

from bokeh.io import show

from bokeh.layouts import column
from bokeh.models import Slider

slider = Slider(start=0, end=10, step=0.1, value=0, title="value")

custom = Custom(text="Special Slider Display", slider=slider)

layout = column(slider, custom)

show(layout)
