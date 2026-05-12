import _ from 'lodash'

export * from './construct.js'
export * from './stack.js'
export * from './types.js'
export * from './utils.js'

/**
 * @summary Apply mixin classes to a derived constructor, copying prototype methods from
 * each base constructor onto the derived constructor's prototype.
 * @param derivedCtor - The target constructor that will receive the mixin methods
 * @param constructors - An array of base constructors whose prototype methods will be copied
 * @see {@link https://www.typescriptlang.org/docs/handbook/mixins.html | TypeScript Mixins}
 */
/** @category Constant */
export const applyMixins = (derivedCtor: any, constructors: any[]) => {
  // Iterate over each base constructor and copy its prototype properties to the derived constructor
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
