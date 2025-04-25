import * as cheerio from 'cheerio'

export const purifyText = (html: string): string => {
  const $ = cheerio.load(html)
  $('script').remove()
  return $.text().trim()
}
