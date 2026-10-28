const assert = require('node:assert/strict')
const { after, before, describe, test } = require('node:test')

const express = require('express')
const { z } = require('zod')

// db.js requires a password; the pool connects lazily, so no database is needed here.
process.env.PGPASSWORD ||= 'test'

const createApp = require('../app/app')
const errorHandler = require('../app/middlewares/error-handler')
const validate = require('../app/middlewares/validate')

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` })
    })
  })
}

describe('app', () => {
  let server
  let baseUrl

  before(async () => {
    ;({ server, baseUrl } = await listen(createApp()))
  })

  after(() => server.close())

  test('GET /health returns ok', async () => {
    const response = await fetch(`${baseUrl}/health`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'ok' })
  })

  test('GET /api/v1 returns API info', async () => {
    const response = await fetch(`${baseUrl}/api/v1`)
    assert.equal(response.status, 200)
    assert.equal((await response.json()).version, 'v1')
  })

  test('unknown routes return JSON 404', async () => {
    const response = await fetch(`${baseUrl}/nope`)
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { message: 'Invalid Route' })
  })

  test('malformed JSON returns 400', async () => {
    const response = await fetch(`${baseUrl}/api/v1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad'
    })
    assert.equal(response.status, 400)
  })
})

describe('validate middleware', () => {
  let server
  let baseUrl

  before(async () => {
    const app = express()
    app.use(express.json())
    app.post(
      '/items',
      validate({ body: z.object({ name: z.string().min(1), price: z.coerce.number().nonnegative() }) }),
      (req, res) => res.json(req.body)
    )
    app.get('/items', validate({ query: z.object({ page: z.coerce.number().int().default(1) }) }), (req, res) =>
      res.json(req.query)
    )
    app.use(errorHandler)
    ;({ server, baseUrl } = await listen(app))
  })

  after(() => server.close())

  test('passes parsed body to the handler', async () => {
    const response = await fetch(`${baseUrl}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'ชาไทย', price: '45' })
    })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { name: 'ชาไทย', price: 45 })
  })

  test('rejects invalid body with field details', async () => {
    const response = await fetch(`${baseUrl}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', price: -1 })
    })
    assert.equal(response.status, 400)
    const body = await response.json()
    assert.equal(body.message, 'Validation failed')
    assert.deepEqual(body.details.map((detail) => detail.path).sort(), ['body.name', 'body.price'])
  })

  test('replaces query with parsed values', async () => {
    const response = await fetch(`${baseUrl}/items`)
    assert.deepEqual(await response.json(), { page: 1 })
  })
})
