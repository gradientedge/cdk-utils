import _ from 'lodash'

export * from './construct'
export * from './stack'
export * from './types'
export * from './utils'

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
