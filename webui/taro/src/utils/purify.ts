import * as cheerio from 'cheerio'

export const purifyText = (html: string): string => {
  const $ = cheerio.load(html)
  $('script').remove()
  $('sup').remove()
  $('think').remove()
  return $.text()
    .trim()
    .replace(/^\[\d\].*$/gm, '')
    .replace('```html', '')
    .replace('```plaintext', '')
    .replace('```', '')
}

export const purifyThink = (html: string): string => {
  const $ = cheerio.load(html)
  $('think').remove()
  return $.html()
    .replace('```html', '')
    .replace('```plaintext', '')
    .replace('```', '')
}
