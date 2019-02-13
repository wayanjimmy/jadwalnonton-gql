import {request} from 'graphql-request'

import {startServer} from './server'

let app: any

beforeAll(async () => {
  app = await startServer()
})

afterAll(() => {
  app.close()
})

const query = `
query {
  hello
}
`

test('hello', async () => {
  try {
    let response = await request('http://127.0.0.1:4000', query)
    expect(response).toEqual({hello: 'Hello World'})
  } catch (_error) {}
})
