/**
 * Custom error class for dashboard template rendering failures
 * - Thrown when required variables or properties are missing from a template
 * - Use {@link TemplateError.isInstance} for type-safe error checking
 * @category Service
 */
export class TemplateError extends Error {
  /** Discriminator flag for identifying TemplateError instances */
  public readonly isTemplateError = true

  /**
   * @summary Create a new TemplateError
   * @param message descriptive error message indicating the rendering failure
   */
  constructor(message: string) {
    super(message)
    this.name = 'TemplateError'
  }

  /**
   * @summary Type guard to check if an unknown error is a TemplateError
   * @param error the error to check
   * @returns true if the error is a TemplateError instance
   */
  static isInstance(error: unknown): error is TemplateError {
    return error instanceof Object && 'isTemplateError' in error && error.isTemplateError === true
  }
}
