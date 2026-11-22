import type {MountOptions} from "@bokeh/bokehjs"

export function same_mount_options(left: MountOptions, right: MountOptions): boolean {
  const left_keys = Object.keys(left) as (keyof MountOptions)[]
  const right_keys = Object.keys(right)
  return left_keys.length == right_keys.length && left_keys.every((key) => left[key] == right[key])
}
