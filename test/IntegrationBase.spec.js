import assert from 'assert'
import Integration from '../src/Integration'

describe('integration base class', () => {
  const integration = new Integration()

  describe('script tempates insert', () => {
    it('when get empty parameters then expected empty query parameter value with valid script', () => {
      const expectedSrc = 'https://www.somedomain.com/landing.js?mode=card'
      const script = 'https://www.somedomain.com/landing.js?codes={{ productCodes }}&mode=card'
      const codes = ''

      let actualAttr = { src: script }
      actualAttr = integration.replaceAttrTemplate({ productCodes: codes }, actualAttr)

      assert.strict.equal(actualAttr.src, expectedSrc)
    })

    it('when get not empty params, expected script url filled value', () => {
      const expectedSrc = 'https://www.somedomain.com/landing.js?codes=100&mode=card'
      const script = 'https://www.somedomain.com/landing.js?codes={{ productCodes }}&mode=card'
      const codes = '100'

      let actualAttr = { src: script }
      actualAttr = integration.replaceAttrTemplate({ productCodes: codes }, actualAttr)

      assert.strict.equal(actualAttr.src, expectedSrc)
    })
  })
})
