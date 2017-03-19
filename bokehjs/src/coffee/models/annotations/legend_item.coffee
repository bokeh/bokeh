import {Model} from "../../model"
import * as p from "core/properties"
import {logger} from "core/logging"
import {uniq} from "core/util/array"
import {ColumnDataSource} from "../../models/sources/column_data_source"

export class LegendItem extends Model
  type: "LegendItem"

  _check_data_sources_on_renderers: () ->
    field = @get_field_from_label_prop()
    if field?
      if @renderers.length < 1
        return false
      source = @renderers[0].data_source
      if source?
        for r in @renderers
          if r.data_source != source
            return false
    return true

  _check_field_label_on_data_source: () ->
    field = @get_field_from_label_prop()
    if field?
      if @renderers.length < 1
        return false
      source = @renderers[0].data_source
      if source? and field not in source.columns()
        return false
    return true


  initialize: (attrs, options) ->
    super(attrs, options)
    # Validate data_sources match
    data_source_validation = @_check_data_sources_on_renderers()
    if not data_source_validation
      logger.error("Non matching data sources on legend item renderers")
    # Validate label in data_source
    field_validation = @_check_field_label_on_data_source()
    if not field_validation
      logger.error("Bad column name on label: #{@label}")


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
      if source instanceof ColumnDataSource
        data = source.get_column(field)
        if data?
          return uniq(data)
        else
          return ["Invalid field"]
    return []
