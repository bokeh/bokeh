import {DocJson} from "../document"

export type DocsJson = {[key: string]: DocJson}

export interface RenderItem {
  elementid: string
  docid?: string
  modelid?: string
  sessionid?: string
  use_for_title?: boolean
  notebook_comms_target?: any
}
