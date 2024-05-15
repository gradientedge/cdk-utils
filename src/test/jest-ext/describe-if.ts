const describeIf = (condition: boolean | (() => boolean), fn: () => void) => {
  if (typeof condition === 'function') {
    condition = condition()
  }
  return condition ? fn() : () => {}
}

const isLengthZero = (value: any[] | number) => {
  if (typeof value === 'number') {
    return value === 0
  }
  return value.length === 0
}

const isLengthOne = (value: any[] | number) => {
  if (typeof value === 'number') {
    return value === 1
  }
  return value.length === 1
}

const isDefined = (value: any) => {
  return value !== undefined
}

export { describeIf, isLengthZero, isLengthOne, isDefined }
