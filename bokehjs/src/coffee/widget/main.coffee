locations = {
  editors:                  [require('./cell_editors'), 'Editor']
  formatters:               [require('./cell_formatters'), 'Formatter']

  TableColumn:              require './table_column'
  DataTable:                require './data_table'
  Paragraph:                require './paragraph'
  HBox:                     require './hbox'
  VBox:                     require './vbox'
  VBoxForm:                 require './vboxform'
  TextInput:                require './text_input'
  AutocompleteInput:        require './autocomplete_input'
  PreText:                  require './pretext'
  Select:                   require './selectbox'
  Slider:                   require './slider'
  CrossFilter:              require './crossfilter'
  MultiSelect:              require './multiselect'
  DateRangeSlider:          require './date_range_slider'
  DatePicker:               require './date_picker'
  Panel:                    require './panel'
  Tabs:                     require './tabs'
  Dialog:                   require './dialog'
  Icon:                     require './icon'
  Button:                   require './button'
  Toggle:                   require './toggle'
  Dropdown:                 require './dropdown'
  CheckboxGroup:            require './checkbox_group'
  RadioGroup:               require './radio_group'
  CheckboxButtonGroup:      require './checkbox_button_group'
  RadioButtonGroup:         require './radio_button_group'
  SimpleApp:                require './simpleapp'

  AppHBox:                  require './layouts/apphbox'
  AppVBox:                  require './layouts/appvbox'
  AppVBoxForm:              require './layouts/appvboxform'
}

{Collections} = require('../common/base')
Collections.register_plugin('widgets', locations)
