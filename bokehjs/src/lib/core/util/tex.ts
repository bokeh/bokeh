const substitutions: {[key: string]: string} = {
  "\\": "}\\backslash{}\\text{",
  "{": "\\{",
  "}": "\\}",
  "#": "\\#",
  $: "\\$",
  "%": "\\%",
  "&": "\\&",
  _: "\\_",
  "^": "\\^{}",
  "~": "\\~{}",
}

export function tex_escape(text: string): string {
  return text.replace(/[\\{}#$%&_^~]/g, (value) => substitutions[value])
}

export function tex_text(text: string): string {
  return `\\text{${tex_escape(text)}}`
}
