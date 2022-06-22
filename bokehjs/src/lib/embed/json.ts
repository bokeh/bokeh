import {DocJson} from "../document"
import {ID} from "core/types"

export type DocsJson = {[key: string]: DocJson}

export type Roots = {[index: string]: ID | HTMLElement}

export interface RenderItem {
  docid?: string
  token?: string
  elementid?: string
  roots?: Roots
  root_ids?: ID[]
  use_for_title?: boolean
  notebook_comms_target?: string
}
