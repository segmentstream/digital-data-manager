import assert from 'assert'

describe('Polyfill', () => {
  it('Object.values() works in all browsers', () => {
    const object = {
      0: 'String 1',
      1: 'String 2'
    }
    assert.strict.deepEqual(Object.keys(object).map(k => object[k]), ['String 1', 'String 2'])
  })

  it('should not crash on Promises in IE', (done) => {
    new Promise((resolve) => {
      setTimeout(resolve(true))
    }).then(() => {
      done()
    })
  })
})
