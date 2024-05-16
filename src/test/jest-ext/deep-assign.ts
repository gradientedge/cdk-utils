import { merge } from 'lodash'

const deepAssign = <TObject, TSource>(object: TObject, source: TSource): TObject & TSource => merge({}, object, source)

export { deepAssign }
