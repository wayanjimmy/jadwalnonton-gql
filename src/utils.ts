import { Request, Response } from 'express'

interface Context {
  req: Request
  res: Response
}

type Resolver = (parent: any, args: any, context: Context, info: any) => any

export interface ResolverMap {
  [key: string]: {
    [key: string]: Resolver | { [key: string]: Resolver }
  }
}

export type Area = {
  name: string
  url: string
}

export type Theater = {
  name: string
  url: string
}

export type Movie = {
  information: string
  title: string
  rating: string
  hours: Array<string>
  genre: string
  duration: string
  price: string
}
