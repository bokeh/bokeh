import {Model} from "../../model"
import type * as p from "core/properties"
import {List, Ref} from "core/kinds"

export namespace GroupBy {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface GroupBy extends GroupBy.Attrs {}

export abstract class GroupBy extends Model {
  declare properties: GroupBy.Props

  constructor(attrs?: Partial<GroupBy.Attrs>) {
    super(attrs)
  }

  abstract query_groups(models: Iterable<Model>, pool: Iterable<Model>): Iterable<Model[]>
}

export namespace GroupByModels {
  export type Attrs = p.AttrsOf<Props>
  export type Props = GroupBy.Props & {
    groups: p.Property<Model[][]>
  }
}

export interface GroupByModels extends GroupByModels.Attrs {}

export class GroupByModels extends GroupBy {
  declare properties: GroupByModels.Props

  constructor(attrs?: Partial<GroupByModels.Attrs>) {
    super(attrs)
  }

  static {
    this.define<GroupByModels.Props>({
      groups: [ List(List(Ref(Model))) ],
    })
  }

  *query_groups(models: Iterable<Model>, _pool: Iterable<Model>): Iterable<Model[]> {
    for (const model of models) {
      for (const group of this.groups) {
        if (group.includes(model)) {
          yield group
        }
      }
    }
  }
}

export namespace GroupByName {
  export type Attrs = p.AttrsOf<Props>
  export type Props = GroupBy.Props
}

export interface GroupByName extends GroupByName.Attrs {}

export class GroupByName extends GroupBy {
  declare properties: GroupByName.Props

  constructor(attrs?: Partial<GroupByName.Attrs>) {
    super(attrs)
  }

  *query_groups(models: Model[], pool: Model[]): Iterable<Model[]> {
    const groups = new Map<string, Set<Model>>()
    for (const model of pool) {
      const {name} = model
      if (name != null) {
        let group = groups.get(name)
        if (group === undefined) {
          group = new Set()
          groups.set(name, group)
        }
        group.add(model)
      }
    }

    for (const model of models) {
      for (const group of groups.values()) {
        if (model.name != null && group.has(model)) {
          yield [...group]
        }
      }
    }
  }
}
