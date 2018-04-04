declare module "underscore.template" {
  function compile_template(template: string): (context: {[key: string]: any}) => string
  export = compile_template
}
