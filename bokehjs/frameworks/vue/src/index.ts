import {defineComponent, h, onScopeDispose, ref, shallowRef, toValue, watch} from "vue"
import type {MaybeRefOrGetter, PropType, Ref, ShallowRef} from "vue"

import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
import {MountController} from "@bokeh/framework"
import type {BokehModel} from "@bokeh/framework"

export type UseBokehOptions = {
  mountOptions?: MaybeRefOrGetter<MountOptions | undefined>
  onMounted?(mounted: BokehMount): void
  onError?(error: unknown): void
}

export type UseBokehResult = {
  mounted: ShallowRef<BokehMount | null>
  error: ShallowRef<unknown>
}

export function useBokeh(model: MaybeRefOrGetter<BokehModel | null>, target: Ref<HTMLElement | null>,
    options: UseBokehOptions = {}): UseBokehResult {
  const mounted = shallowRef<BokehMount | null>(null)
  const error = shallowRef<unknown>(null)
  let controller: MountController | null = null

  const stop = watch(
    [() => toValue(model), () => target.value, () => toValue(options.mountOptions)?.signal],
    ([current_model, current_target]) => {
      controller?.dispose()
      controller = null
      mounted.value = null
      error.value = null

      if (current_model == null || current_target == null) {
        return
      }

      controller = new MountController()
      void controller.start(current_model, current_target, {
        mountOptions: toValue(options.mountOptions),
        onMounted: (handle) => {
          mounted.value = handle
          options.onMounted?.(handle)
        },
        onDisposed: (handle) => {
          if (mounted.value == handle) {
            mounted.value = null
          }
        },
        onError: (reason) => {
          error.value = reason
          options.onError?.(reason)
        },
      })
    },
    {immediate: true, flush: "post"},
  )

  onScopeDispose(() => {
    stop()
    controller?.dispose()
  })

  return {mounted, error}
}

export const Bokeh = defineComponent({
  name: "Bokeh",
  inheritAttrs: false,
  props: {
    /** The Bokeh root, roots array, or document to render in one mount. */
    model: {type: [Object, Array] as PropType<BokehModel>, required: true},
    mountOptions: {type: Object as PropType<MountOptions>, default: undefined},
  },
  emits: {
    mounted: (_mounted: BokehMount) => true,
    "mount-error": (_error: unknown) => true,
  },
  setup(props, {attrs, emit}) {
    const target = ref<HTMLElement | null>(null)
    useBokeh(() => props.model, target, {
      mountOptions: () => props.mountOptions,
      onMounted: (mounted) => emit("mounted", mounted),
      onError: (error) => emit("mount-error", error),
    })
    return () => h("div", {...attrs, ref: target})
  },
})
