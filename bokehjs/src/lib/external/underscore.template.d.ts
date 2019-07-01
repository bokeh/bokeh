declare module "underscore.template" {
  function compile_template(template: string): (context: {[key: string]: unknown}) => string
  export = compile_template
}
