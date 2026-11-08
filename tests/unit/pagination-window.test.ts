import { describe, expect, it } from 'vitest'
import { paginationWindow } from '@/lib/paginationWindow'

describe('sliding pagination window', () => {
  it('shows the first three pages at the start', () => {
    expect(paginationWindow(1, 33).pages).toEqual([1, 2, 3])
    expect(paginationWindow(2, 33).pages).toEqual([1, 2, 3])
  })

  it('centers the current page after the start', () => {
    expect(paginationWindow(3, 33).pages).toEqual([2, 3, 4])
    expect(paginationWindow(4, 33).pages).toEqual([3, 4, 5])
    expect(paginationWindow(5, 33).pages).toEqual([4, 5, 6])
  })

  it('clamps at the final page', () => {
    expect(paginationWindow(33, 33).pages).toEqual([31, 32, 33])
    expect(paginationWindow(99, 33).page).toBe(33)
  })
})
