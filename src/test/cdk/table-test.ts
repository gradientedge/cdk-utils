import { CommonStackProps } from '../../lib'

type TableTestTuple<P extends CommonStackProps, E> = [string, P, E]

export type { TableTestTuple }
