# BokehJS WebGL architecture

WebGL rendering uses two ordered layers of deferred work:

1. `WebGLCompositor` queues glyph commands across renderer boundaries. Any
   Canvas renderer is a barrier that flushes and blits preceding WebGL work.
2. `ReglCommandBatcher` combines adjacent compatible regl submissions. It
   never reorders commands, so alpha blending and renderer z-order are stable.
   Its resource set provides scoped mutation barriers: changing a buffer or
   texture flushes only a pending batch that references that resource. Batch
   statistics count regl dispatches, not the underlying WebGL draw operations.

Before Canvas2D reads the shared WebGL canvas, queued commands are submitted and
GPU completion is awaited. This is an ordering requirement and avoids incomplete
cross-canvas copies in WebKit.

`RevisionState` separates geometry, mapping, visual, and selection revisions.
Consumers keep independent cursors, and `WrappedBuffer` exposes full, ranged,
and sparse uploads with CPU/GPU revision counters.

GPU ownership is explicit. Glyph resources belong to a `GPUResourceOwner`;
shared geometry, framebuffers, shader commands, VAOs, and dash textures belong
to `ReglWrapper`. Destruction is deterministic and idempotent.

Initialization prefers WebGL2 and falls back to WebGL1. WebGL2 exposes uniform
buffers and core vertex-array support; WebGL1 uses the corresponding extensions
when available. A small adapter presents WebGL2's core instancing, blend,
32-bit-index, and vertex-array APIs through the extension contracts expected by
regl. Shader sources use `#include <bokeh_...>` modules assembled by
`shader_modules.ts`, keeping precision and screen projection definitions shared.
