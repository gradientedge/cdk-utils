/** @category Service */
export class TemplateError extends Error {
  public readonly isTemplateError = true

  constructor(message: string) {
    super(message)
    this.name = 'TemplateError'
  }

  static isInstance(error: unknown): error is TemplateError {
    return error instanceof Object && 'isTemplateError' in error && error.isTemplateError === true
  }
}
