declare module "*/bokeh.esm.js" {
  export * from "index"
  export * from "api"
  export * as Widgets from "models/widgets/index"
  export * as Tables from "models/widgets/tables/index"
  export {
    mount, when_mounted, publish_mount_error,
    BokehMount, MountError, MountSource,
    BOKEH_MOUNTED_ATTRIBUTE, BOKEH_MOUNTED_EVENT, BOKEH_MOUNT_ERROR_EVENT,
  } from "api/io"
  export type {
    KeyedRoots, MountOptions, MountOwnership, MountState, MountTarget, MountTargets, RootKey,
    Showable, ShowableRoot, ViewLookup, WhenMountedOptions,
  } from "api/io"
}

declare module "*/bokeh-api.esm.js" {}
declare module "*/bokeh-widgets.esm.js" {}
declare module "*/bokeh-tables.esm.js" {}
declare module "*/bokeh-mathjax.esm.js" {}
