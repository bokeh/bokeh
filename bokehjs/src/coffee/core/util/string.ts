export function startsWith(str: string, searchString: string, position: number = 0): boolean {
  return str.substr(position, searchString.length) == searchString
}

export function uniqueId(prefix?: string): string {
  // from ipython project
  // http://www.ietf.org/rfc/rfc4122.txt
  const s = new Array<string>(32)
  const hexDigits = "0123456789ABCDEF"
  for (let i = 0; i < 32; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[12] = "4"                                                     // bits 12-15 of the time_hi_and_version field to 0010
  s[16] = hexDigits.substr((s[16].charCodeAt(0) & 0x3) | 0x8, 1)  // bits 6-7 of the clock_seq_hi_and_reserved to 01

  const uuid = s.join("")
  if (prefix != null)
    return `${prefix}-${uuid}`
  else
    return uuid
}

export function escape(s: string): string {
  return s.replace(/(?:[&<>"'`])/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#x27;';
      case '`': return '&#x60;';
    }
  })
}
