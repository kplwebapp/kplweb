import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ballsToOversDisplay, oversDisplayToBalls } from '../src/utils/cricket'

describe('cricket overs notation', () => {
  it('converts legal balls to overs.balls display', () => {
    assert.equal(ballsToOversDisplay(0), '0.0')
    assert.equal(ballsToOversDisplay(17), '2.5')
    assert.equal(ballsToOversDisplay(120), '20.0')
  })

  it('parses overs display back to legal balls', () => {
    assert.equal(oversDisplayToBalls('2.5'), 17)
    assert.equal(oversDisplayToBalls('20.0'), 120)
  })

  it('rejects invalid ball counts in the decimal place', () => {
    assert.throws(() => oversDisplayToBalls('1.6'))
  })
})
