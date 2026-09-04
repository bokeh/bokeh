import type Bokeh from "/static/js/bokeh.esm.js"
import type {
  BOKEH_MOUNTED_ATTRIBUTE, BOKEH_MOUNTED_EVENT, BOKEH_MOUNT_ERROR_EVENT,
  BokehMount, MountError, MountSource, ViewLookup, WhenMountedOptions,
  mount, publish_mount_error, when_mounted,
} from "/static/js/bokeh.esm.js"

export interface BundleMountDeclarationContract {
  default_mount: typeof Bokeh.mount
  direct_mount: typeof mount
  discover: typeof when_mounted
  publish_error: typeof publish_mount_error
  mounted_attribute: typeof BOKEH_MOUNTED_ATTRIBUTE
  mounted_event: typeof BOKEH_MOUNTED_EVENT
  mount_error_event: typeof BOKEH_MOUNT_ERROR_EVENT
  handle: BokehMount
  source: MountSource
  error: MountError
  view_lookup: ViewLookup
  discovery_options: WhenMountedOptions
  target_handle: HTMLElement["bokehMount"]
  target_error: HTMLElement["bokehMountError"]
}
