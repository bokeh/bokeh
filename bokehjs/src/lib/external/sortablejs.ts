import type Sortable from "sortablejs"

export type SortableInstance = Sortable

declare module "sortablejs" {
  export type SortableInstance = Sortable
}
