import {GraphQLServer} from 'graphql-yoga'
import axios from 'axios'
import * as express from 'express'
import cheerio from 'cheerio'

interface Context {
  req: express.Request
  res: express.Response
}

type Resolver = (parent: any, args: any, context: Context, info: any) => any

interface ResolverMap {
  [key: string]: {
    [key: string]: Resolver | {[key: string]: Resolver}
  }
}

type Area = {
  locale: string
  url: string
}

const typeDefs = `
type Query {
  hello(name: String): String!
  allAreas(page: Int): [Area!]!
}

type Area {
  locale: String
  url: String
}
`

const resolvers: ResolverMap = {
  Query: {
    hello: (_parent, {name = 'World'}) => `Hello ${name}`,
    allAreas: async (_parent, _args) => {
      let locales: Array<Area> = []

      try {
        let {data: html} = await axios.get<string>('https://jadwalnonton.com/bioskop')
        let $ = cheerio.load(html)

        locales = $('#ctfilcon > div.filterlist > ul:nth-child(1) li a')
          .map((_index, element) => {
            return {
              locale: $(element).text(),
              url: $(element).attr('href')
            }
          })
          .get()
      } catch (error) {}

      return locales
    }
  }
}

const server = new GraphQLServer({typeDefs, resolvers})

server.start(() => console.log('Server is running on localhost:4000'))
