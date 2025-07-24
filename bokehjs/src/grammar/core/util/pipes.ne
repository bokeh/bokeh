@builtin "whitespace.ne"
@builtin "number.ne"
@builtin "string.ne"

Pipe -> Call ( _ "|" _ Call ):* {% (d) => {return [d[0], ...d[1].map((p) => p[3])] } %}

Call -> Name ( "(" _ Args:? _ ")" ):? {% (d) => { return {name: d[0], args: d[1] != null ? d[1][2] : []} } %}

Name -> [a-z_] [a-z0-9_]:* {% (d) => { return {lit: `${d[0]}${d[1].join("")}`} } %}

Args -> Arg ( _ "," _ Arg ):* {% (d) => { return [d[0], ...d[1].map((p) => p[3])] } %}

Arg -> ( decimal | str | Name ) {% (d) => { return d[0][0] } %}

str -> (dqstring | sqstring ) {% (d) => { return d[0][0] } %}
