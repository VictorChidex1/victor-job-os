import { describe, expect, it } from 'vitest'
import { stripUndefined } from '../../functions/src/automation/serialize'

describe('automation write serialization', () => {
  it('removes undefined values recursively', () => {
    const value = {
      title: 'Application',
      empty: undefined,
      fields: [
        {
          key: 'field-1',
          id: undefined,
          required: true,
          options: undefined,
        },
      ],
      nested: {
        keep: 'yes',
        drop: undefined,
      },
    }

    expect(stripUndefined(value)).toEqual({
      title: 'Application',
      fields: [
        {
          key: 'field-1',
          required: true,
        },
      ],
      nested: {
        keep: 'yes',
      },
    })
  })

  it('removes undefined array entries', () => {
    expect(stripUndefined([1, undefined, { value: undefined, keep: 2 }])).toEqual([
      1,
      { keep: 2 },
    ])
  })
})
