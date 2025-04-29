import * as cheerio from 'cheerio'

export const purifyText = (html: string): string => {
  const $ = cheerio.load(html)
  $('script').remove()
  $('sup').remove()
  $('think').remove()
  return $.text()
    .trim()
    .replace(/^\[\d\].*$/gm, '')
}

export const purifyThink = (html: string): string => {
  const $ = cheerio.load(html)
  $('think').remove()
  $('reasoning').remove()
  return $.html()
}
