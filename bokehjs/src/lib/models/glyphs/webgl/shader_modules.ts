const shader_modules = new Map<string, string>([
  ["bokeh_vertex_precision", "precision highp float;"],
  ["bokeh_fragment_precision", `\
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif`],
  ["bokeh_screen_projection", `\
vec4 bokeh_screen_to_clip(vec2 position, vec2 canvas_size)
{
  vec2 projected = (position + 0.5) / canvas_size;
  return vec4(2.0*projected.x - 1.0, 1.0 - 2.0*projected.y, 0.0, 1.0);
}`],
])

const include_re = /#include\s+<([a-zA-Z0-9_]+)>/g

/** Resolve Bokeh's small GLSL module syntax before handing source to regl. */
export function assemble_shader(source: string): string {
  const included = new Set<string>()
  const expand = (input: string, stack: string[]): string => input.replace(include_re, (_match, name: string) => {
    if (stack.includes(name)) {
      throw new Error(`cyclic shader module include: ${[...stack, name].join(" -> ")}`)
    }
    const module = shader_modules.get(name)
    if (module == null) {
      throw new Error(`unknown shader module: ${name}`)
    }
    if (included.has(name)) {
      return ""
    }
    included.add(name)
    return expand(module, [...stack, name])
  })
  return expand(source, [])
}
