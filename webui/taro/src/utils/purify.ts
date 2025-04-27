import * as cheerio from 'cheerio'

export const purifyText = (html: string): string => {
  const $ = cheerio.load(html)
  $('script').remove()
  $('sup').remove()
  $('think').remove()
  return $.text().trim()
}

export const purifyKeepSub = (html: string): string => {
  const $ = cheerio.load(html)
  $('script').remove()
  $('think').remove()
  return $.text().trim()
}

export const purifyThink = (html: string): string =>{
  const $ = cheerio.load(html)
  $('think').remove()
  return $.text().trim()
}
