import * as cheerio from 'cheerio'

export const purifyText = (html: string): string => {
  const $ = cheerio.load(html)
  $('script').remove()
  $('sup').remove()
  $('think').remove()
  return $.text().trim()
}
