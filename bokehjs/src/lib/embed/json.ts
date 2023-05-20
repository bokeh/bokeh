import type {DocJson} from "../document"
import type {ID} from "core/types"
import type {EmbedTarget} from "./dom"

export type DocsJson = {[key: string]: DocJson}

export type Roots = {[index: string]: ID | EmbedTarget}

export interface RenderItem {
  docid?: string
  token?: string
  elementid?: string
  roots?: Roots
  root_ids?: ID[]
  use_for_title?: boolean
  notebook_comms_target?: string
}
