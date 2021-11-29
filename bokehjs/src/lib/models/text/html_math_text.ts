import { default_provider } from "./providers"

export async function load_mathjax() {
  if (default_provider.status == "not_started")
    await default_provider.fetch()
}

export function tex2html(text: string): string {
  if (!default_provider.MathJax)
    return text

  const tex_parts = default_provider.MathJax.find_tex(text)
  const processed_text: string[] = []

  let last_index: number | undefined = 0
  for (const part of tex_parts) {
    processed_text.push(text.slice(last_index, part.start.n))
    processed_text.push(default_provider.MathJax.tex2svg(part.math, {display: part.display}).outerHTML)

    last_index = part.end.n
  }

  if (last_index! < text.length)
    processed_text.push(text.slice(last_index))

  return processed_text.join("")
}

export function contains_tex(text: string): boolean {
  if (!default_provider.MathJax)
    return false

  return default_provider.MathJax.find_tex(text).length > 0
};
