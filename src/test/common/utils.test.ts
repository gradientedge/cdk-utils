import { describe, expect, it } from 'vitest'
import { LogLevel, isDevStage, isTestStage, isUatStage, isPrdStage } from '../../lib/common/utils.js'

describe('Common Utils', () => {
  describe('LogLevel', () => {
    it('has correct enum values', () => {
      expect(LogLevel.DEBUG).toBe('DEBUG')
      expect(LogLevel.INFO).toBe('INFO')
      expect(LogLevel.WARNING).toBe('WARNING')
      expect(LogLevel.TRACE).toBe('TRACE')
      expect(LogLevel.ERROR).toBe('ERROR')
      expect(LogLevel.CRITICAL).toBe('CRITICAL')
    })
  })

  describe('Stage utilities', () => {
    it('identifies dev stage correctly', () => {
      expect(isDevStage('dev')).toBe(true)
      expect(isDevStage('test')).toBe(false)
      expect(isDevStage('uat')).toBe(false)
      expect(isDevStage('prd')).toBe(false)
    })

    it('identifies test stage correctly', () => {
      expect(isTestStage('tst')).toBe(true)
      expect(isTestStage('dev')).toBe(false)
      expect(isTestStage('uat')).toBe(false)
      expect(isTestStage('prd')).toBe(false)
    })

    it('identifies uat stage correctly', () => {
      expect(isUatStage('uat')).toBe(true)
      expect(isUatStage('dev')).toBe(false)
      expect(isUatStage('tst')).toBe(false)
      expect(isUatStage('prd')).toBe(false)
    })

    it('identifies prd stage correctly', () => {
      expect(isPrdStage('prd')).toBe(true)
      expect(isPrdStage('dev')).toBe(false)
      expect(isPrdStage('tst')).toBe(false)
      expect(isPrdStage('uat')).toBe(false)
    })
  })
})
