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
  name: string
  url: string
}

type Theater = {
  name: string
  url: string
}

type Movie = {
  information: string
  title: string
  rating: string
  hours: Array<string>
  genre: string
  duration: string
  price: string
}

const typeDefs = `
type Query {
  hello(name: String): String!
  allAreas(page: Int): [Area!]!
  allTheaters(url: String): [Theater!]!
  allMovies(url: String): [Movie!]!
}

type Area {
  name: String
  url: String
}

type Theater {
  name: String
  url: String
}

type Movie {
  information: String
  title: String
  rating: String
  hours: [String]
  genre: String
  duration: String
  price: String
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
          .map(
            (_index, element): Area => {
              return {
                name: $(element).text(),
                url: $(element).attr('href')
              }
            }
          )
          .get()
      } catch (_error) {}

      return locales
    },
    allTheaters: async (_parent, {url}) => {
      let theaters: Array<Theater> = []
      try {
        let {data: html} = await axios.get<string>(url)
        let $ = cheerio.load(html)
        theaters = $('#main > div.row.clearfix.thlist .item.theater')
          .map(
            (_index, element): Theater => ({
              name: $(element)
                .find('.judul')
                .text(),
              url: $(element)
                .find('.mojadwal')
                .attr('href')
            })
          )
          .get()
      } catch (_error) {}
      return theaters
    },
    allMovies: async (_parent, {url}) => {
      let movies: Array<Movie> = []
      let {data: html} = await axios.get(url)
      let $ = cheerio.load(html)
      movies = $('#main > div.mtom20 .item')
        .map(
          (_index, element): Movie => {
            let [genre, duration] = $(element)
              .find('.sched_desc > p:nth-child(2)')
              .text()
              .split(' - ')
            let hours = $(element)
              .find('.usch > li.active')
              .map((index, hour) => {
                return $(hour).text()
              })
              .get()
            return {
              information: $(element)
                .find('h2 > a')
                .attr('href'),
              title: $(element)
                .find('h2 > a')
                .text(),
              rating:
                $(element)
                  .find('.rating')
                  .text() === ''
                  ? 'unrated'
                  : $(element)
                      .find('.rating')
                      .text(),
              hours,
              genre,
              duration,
              price: $(element)
                .find('.htm')
                .text()
                .replace('Harga tiket masuk ', '')
            }
          }
        )
        .get()
      try {
      } catch (_error) {}

      return movies
    }
  }
}

const server = new GraphQLServer({typeDefs, resolvers})

server.start(() => console.log('Server is running on localhost:4000'))
