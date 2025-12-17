import _ from 'lodash'

export * from './construct.js'
export * from './stack.js'
export * from './types.js'
export * from './utils.js'

export const applyMixins = (derivedCtor: any, constructors: any[]) => {
  _.forEach(constructors, baseConstructor => {
    Object.getOwnPropertyNames(baseConstructor.prototype).forEach(name => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseConstructor.prototype, name) || Object.create(null)
      )
    })
  })
}
