import {GraphQLServer} from 'graphql-yoga'
import axios from 'axios'
import cheerio from 'cheerio'

import {ResolverMap, Area, Theater, Movie} from './utils'

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

function getRating($: CheerioStatic, element: CheerioElement) {
  let rating = $(element)
    .find('.rating')
    .text()

  if (rating === '') {
    return 'unrated'
  }

  return rating
}

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
              .map((_index, hour) => {
                return $(hour).text()
              })
              .get()
            let information = $(element)
              .find('h2 > a')
              .attr('href')
            let title = $(element)
              .find('h2 > a')
              .text()

            let rating = getRating($, element)

            let price = $(element)
              .find('.htm')
              .text()
              .replace('Harga tiket masuk ', '')

            return {
              information,
              title,
              rating,
              hours,
              genre,
              duration,
              price
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
