declare module "underscore.template" {
  export const _: {
    template(template: string): (context: {[key: string]: unknown}) => string
  }
}

declare module "underscore.template/lib/underscore.template.js" {
  const _: {
    template(template: string): (context: {[key: string]: unknown}) => string
  }
  export default _
}
