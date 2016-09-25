_ = require "underscore"
HasProps = require "../../core/has_props"
Model = require "../../model"
p = require "../../core/properties"

class LegendItem extends Model
  type: "LegendItem"

  @define {
      label: [ p.StringSpec, null ]
      renderers: [ p.Array, [] ]
  }

  get_field_from_label_prop: () =>
    if @label? and @label.field?
      return @label.field

  get_labels_list_from_label_prop: () =>
    # Always return a list of the labels
    if @label? and @label.value?
      return [@label.value]
    field = @get_field_from_label_prop()
    if field?
      if @renderers[0] and @renderers[0].data_source?
        source = @renderers[0].data_source
      else
        return ["No source found"]
      if source.get_column?
        data = source.get_column(field)
        if data
          return _.unique(data)
        else
          return ["Invalid field"]
    return []

module.exports =
  Model: LegendItem
