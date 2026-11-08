import {Fragment, defineComponent, h, inject, onScopeDispose, provide, ref, shallowRef, toValue, watch} from "vue"
import type {ComponentOptionsMixin, DefineComponent, InjectionKey, MaybeRefOrGetter, PropType, Ref, ShallowRef} from "vue"

import type {BokehMount, ClientSession, MountOptions} from "@bokeh/bokehjs"
import {DocumentMountController, MountController, SessionMountController} from "@bokeh/framework"
import type {BokehModel, BokehRootModel, BokehRootReference, BokehSessionSource} from "@bokeh/framework"

/** Reactive options and callbacks for a Vue-owned Bokeh mount. */
export type UseBokehOptions = {
  mountOptions?: MaybeRefOrGetter<MountOptions | undefined>
  onMounted?(mounted: BokehMount): void
  onError?(error: unknown): void
}

/** Reactive readiness/error state returned by `useBokeh()`. */
export type UseBokehResult = {
  mounted: ShallowRef<BokehMount | null>
  error: ShallowRef<unknown>
}

type MountEvents = {
  mounted: (mounted: BokehMount) => true
  "mount-error": (error: unknown) => true
}

type SessionEvents = MountEvents & {
  session: (session: ClientSession) => true
}

type Empty = Record<never, never>

// Keep declarations within Vue 3.3's public type parameters. Inferring the
// entire component type exposes additional parameters introduced by newer Vue.
type MountComponent<Props> = DefineComponent<Props, Empty, Empty, Empty, Empty, ComponentOptionsMixin, ComponentOptionsMixin, MountEvents>
type SessionComponent<Props> = DefineComponent<Props, Empty, Empty, Empty, Empty, ComponentOptionsMixin, ComponentOptionsMixin, SessionEvents>

/** Mount reactive Bokeh content and dispose it with the current Vue scope. */
export function useBokeh(model: MaybeRefOrGetter<BokehModel | null>, target: Ref<HTMLElement | null>,
    options: UseBokehOptions = {}): UseBokehResult {
  const mounted = shallowRef<BokehMount | null>(null)
  const error = shallowRef<unknown>(null)
  let controller: MountController | null = null

  const stop = watch(
    [() => toValue(model), () => target.value, () => toValue(options.mountOptions)],
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

const bokeh_component = defineComponent({
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

/** Component that owns one Bokeh target and lifecycle handle. */
export const Bokeh: MountComponent<{model: BokehModel, mountOptions?: MountOptions}> = bokeh_component

const BokehDocumentKey: InjectionKey<DocumentMountController | SessionMountController> = Symbol("BokehDocument")

const bokeh_document_component = defineComponent({
  name: "BokehDocument",
  props: {
    models: {type: Array as PropType<readonly BokehRootModel[]>, required: true},
    mountOptions: {type: Object as PropType<MountOptions>, default: undefined},
  },
  emits: {
    mounted: (_mounted: BokehMount) => true,
    "mount-error": (_error: unknown) => true,
  },

  setup(props, {emit, slots}) {
    const controller = new DocumentMountController()
    provide(BokehDocumentKey, controller)
    const stop = watch(
      [() => props.models, () => props.mountOptions],
      () => controller.update(props.models, {
        mountOptions: props.mountOptions,
        onMounted: (mounted) => emit("mounted", mounted),
        onError: (error) => emit("mount-error", error),
      }),
      {immediate: true, flush: "post"},
    )
    onScopeDispose(() => {
      stop()
      controller.dispose()
    })
    return () => h(Fragment, null, slots.default?.())
  },
})

/** Provider for one shared mount and its descendant keyed root slots. */
export const BokehDocument: MountComponent<{models: readonly BokehRootModel[], mountOptions?: MountOptions}> = bokeh_document_component

const bokeh_session_component = /* @__PURE__ */ defineComponent({
  name: "BokehSession",
  props: {
    source: {type: Object as PropType<BokehSessionSource>, required: true},
    mountOptions: {type: Object as PropType<MountOptions>, default: undefined},
  },
  emits: {
    session: (_session: ClientSession) => true,
    mounted: (_mounted: BokehMount) => true,
    "mount-error": (_error: unknown) => true,
  },

  setup(props, {emit, slots}) {
    const controller = new SessionMountController()
    provide(BokehDocumentKey, controller)
    const stop = watch(
      [() => props.source, () => props.mountOptions],
      () => controller.update(props.source, {
        mountOptions: props.mountOptions,
        onSession: (session) => emit("session", session),
        onMounted: (mounted) => emit("mounted", mounted),
        onError: (error) => emit("mount-error", error),
      }),
      {immediate: true, flush: "post"},
    )
    onScopeDispose(() => {
      stop()
      controller.dispose()
    })
    return () => h(Fragment, null, slots.default?.())
  },
})

/** Provider borrowing or acquiring a live session for descendant keyed root slots. */
export const BokehSession: SessionComponent<{source: BokehSessionSource, mountOptions?: MountOptions}> = bokeh_session_component

const bokeh_root_component = defineComponent({
  name: "BokehRoot",
  inheritAttrs: false,
  props: {
    model: {type: [Object, String] as PropType<BokehRootReference>, required: true},
  },

  setup(props, {attrs}) {
    const controller = inject(BokehDocumentKey)
    if (controller == null) {
      throw new Error("BokehRoot must be rendered inside a BokehDocument or BokehSession")
    }

    const target = ref<HTMLElement | null>(null)
    let detach: (() => void) | null = null
    const stop = watch(
      [() => props.model, () => target.value],
      ([model, element]) => {
        detach?.()
        detach = element != null ? controller.attach(model, element) : null
      },
      {immediate: true, flush: "post"},
    )
    onScopeDispose(() => {
      stop()
      detach?.()
    })
    return () => h("div", {...attrs, ref: target})
  },
})

/** Target slot for a decoded root, or a root name supplied by the nearest `BokehSession`. */
export const BokehRoot: DefineComponent<{model: BokehRootReference}, Empty, Empty, Empty, Empty> = bokeh_root_component
