import {Filter} from "./filter"
import * as p from "core/properties"
import {keys, values} from "core/util/object"
import {DataSource} from "../sources/data_source"
import {use_strict} from "core/util/string"

export namespace CustomJSFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    args: p.Property<{[key: string]: unknown}>
    code: p.Property<string>
  }
}

export interface CustomJSFilter extends CustomJSFilter.Attrs {}

export class CustomJSFilter extends Filter {
  properties: CustomJSFilter.Props

  constructor(attrs?: Partial<CustomJSFilter.Attrs>) {
    super(attrs)
  }

  static init_CustomJSFilter(): void {
    this.define<CustomJSFilter.Props>({
      args:       [ p.Any,     {}    ], // TODO (bev) better type
      code:       [ p.String,  ''    ],
    })
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): any[] {
    return values(this.args)
  }

  get func(): Function {
    const code = use_strict(this.code)
    return new Function(...this.names, "source", code)
  }

  compute_indices(source: DataSource): number[] | null {
    this.filter = this.func(...this.values, source)
    return super.compute_indices(source)
  }
}
