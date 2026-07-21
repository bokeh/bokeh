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

## Data-to-screen mapping

High-volume `Line` and `Scatter` glyphs with direct linear or logarithmic
scales keep immutable data-coordinate buffers on the GPU. Coordinates are
stored as Float32 deltas from a stable, double-precision origin kept with each
buffer. The current range origin is subtracted in JavaScript before the small
offset, scale, and target values are sent as uniforms. This preserves small
differences in datetime and other large-offset coordinates without requiring
64-bit shader arithmetic or increasing per-vertex bandwidth.

Pans and zooms therefore update only six mapping uniform values per draw; they
do not run `Scale.v_compute()` over every point and do not upload coordinate
buffers. Logarithms are computed once when data is packed. CPU screen arrays
are materialized lazily when hit testing or anchor calculations need them.

This is a deliberately hybrid boundary. Dashed lines still use CPU screen
coordinates because dash phase depends on cumulative screen-space distance.
Composite, categorical, and custom coordinate mappings also retain the JS scale
path. If a deep zoom would magnify Float32 rebasing error beyond a quarter
screen pixel, that glyph temporarily uses the CPU path as well. Adding a new
GPU mapping requires an exact affine representation in a transformed domain
plus equivalent missing-value semantics; otherwise it must fall back rather
than approximate the mapper.

GPU ownership is explicit. Glyph resources belong to a `GPUResourceOwner`;
shared geometry, framebuffers, shader commands, VAOs, and dash textures belong
to `ReglWrapper`. Destruction is deterministic and idempotent.

Initialization prefers WebGL2 and falls back to WebGL1. WebGL2 exposes uniform
buffers and core vertex-array support; WebGL1 uses the corresponding extensions
when available. A small adapter presents WebGL2's core instancing, blend,
32-bit-index, and vertex-array APIs through the extension contracts expected by
regl. Shader sources use `#include <bokeh_...>` modules assembled by
`shader_modules.ts`, keeping precision and screen projection definitions shared.
The `bokeh_data_mapping` module is compiled only into commands that consume
packed data coordinates, so fallback commands retain their previous shaders and
attribute layouts.
