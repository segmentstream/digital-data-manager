import assert from 'assert'
import cyrillicToTranslit from '../../../src/integrations/utils/transliterate'

describe('transliterate', () => {
  it('shoult tranliterate correct for ru preset', () => {
    const t = cyrillicToTranslit({ preset: 'ru' })
    const from = 'Съешь же ещё этих мягких французских булок, да выпей чаю.'
    const to = "Sesh zhe esh'e etih myagkih francuzskih bulok, da vipei chayu."
    assert.strict.equal(t.transform(from), to)
  })

  it('shoult tranliterate correct for uk preset', () => {
    const t = cyrillicToTranslit({ preset: 'uk' })
    const from = 'В чащах юга жил бы цитрус? Да, но фальшивый экземпляр!'
    const to = 'V chashchakh iuha zhyl bi tsytrus? Da, no falshyvii ekzempliar!'

    assert.strict.equal(t.transform(from), to)
  })
})
