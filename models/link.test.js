const Link = require('./link')
const User = require('./user')
const normalizeURL = require('normalize-url')

describe('Link', () => {
  const originalURLs = ['www.nodejs.org', 'example.com', 'http://google.com']
  const normalizedURLs = originalURLs.map(url =>
    normalizeURL(url, { forceHttps: true })
  )

  const links = []
  let user

  beforeAll(async () => {
    const id = 'jestuser'
    await Link.query()
      .delete()
      .where('creatorId', id)
    await Promise.all([
      Link.query()
        .delete()
        .whereIn('originalURL', originalURLs),
      User.query()
        .delete()
        .where({ id })
    ])

    user = await User.query().insert({ id })
  })

  it('shortens URL', async () => {
    let link = await user
      .$relatedQuery('links')
      .insert({ originalURL: originalURLs[0] })
    link = link.toJSON()
    links.push(link)

    expect(typeof link.id).toBe('string')
    expect(link.id.length).toBeGreaterThanOrEqual(
      Link.jsonSchema.properties.hash.minLength
    )

    expect(link.originalURL).toEqual(normalizedURLs[0])
    expect(link.shortenedURL).toBeDefined()
    expect(link.brandedURL).toBeUndefined()
    expect(link.meta).toBeDefined()
  })

  it('prevents duplicate URLs', async () => {
    await expect(
      user.$relatedQuery('links').insert({ originalURL: originalURLs[0] })
    ).rejects.toThrow()
  })

  it('prevents URL redirect loop', async () => {
    await expect(
      user
        .$relatedQuery('links')
        .insert({ originalURL: process.env.BASE_URL + '/hello' })
    ).rejects.toThrow()
  })

  it('rejects invalid URLs', async () => {
    await expect(
      user.$relatedQuery('links').insert({ originalURL: '1234 0' })
    ).rejects.toThrow()
  })

  it('rejects valid but nonexistent URLs', async () => {
    await expect(
      user.$relatedQuery('links').insert({ originalURL: 'nodejsssssss.org' })
    ).rejects.toThrow()
  })

  const hash = 'FooBar'
  it('can set custom hash', async () => {
    const link = await user.$relatedQuery('links').insert({
      originalURL: originalURLs[1],
      hash
    })

    expect(link.hash).toEqual(hash)
    expect(link.brandedURL).toBeDefined()

    links.push(link.toJSON())
  })

  it('prevents duplicate custom hash', async () => {
    await expect(
      user.$relatedQuery('links').insert({ originalURL: originalURLs[2], hash })
    ).rejects.toThrow()
  })

  it('prevents custom hash that clashes with hashIds', async () => {
    const generatedHash = Link._hashIdInstance.encode(500)
    await expect(
      user
        .$relatedQuery('links')
        .insert({ originalURL: originalURLs[2], hash: generatedHash })
    ).rejects.toThrow()
  })

  test('QueryBuilder#findByHashId', async () => {
    const [link0, link1] = await Promise.all([
      user.$relatedQuery('links').findByHashId(links[0].id),
      user.$relatedQuery('links').findByHashId(links[1].id)
    ])

    expect(link0.originalURL).toEqual(links[0].originalURL)
    expect(link1.originalURL).toEqual(links[1].originalURL)
  })

  test('QueryBuilder#findByURL', async () => {
    const link = await user
      .$relatedQuery('links')
      .findByURL(links[0].originalURL)
    expect(link.shortenedURL).toEqual(links[0].shortenedURL)
  })
})
