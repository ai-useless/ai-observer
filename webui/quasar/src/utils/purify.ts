import * as cheerio from 'cheerio'

export const purifyText = (html: string): string => {
  html = html.slice(
    html.indexOf('</think>') < 0 ? 0 : html.indexOf('</think>') + 8
  )
  const $ = cheerio.load(html)
  $('script').remove()
  $('style').remove()
  $('sup').remove()
  $('think').remove()
  return $.text()
    .trim()
    .replace(/^\[\d\].*$/gm, '')
    .replace('html', '')
    .replace('markdown', '')
    .replace('plain', '')
    .replace('txt', '')
    .replace('text', '')
    .replace(/ /g, '')
    .replace('plaintext', '')
    .replace(/`/g, '')
    .replace(/#/g, '')
    .replace(/\*/g, '')
    .replace(/ /g, '')
    .replace(/<!DOCTYPE html[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .replace(/<head[^>]*>/gi, '')
    .replace(/<\/head>/gi, '')
    .trim()
}

export const purifyThink = (html: string): string => {
  html = html.slice(
    html.indexOf('</think>') < 0 ? 0 : html.indexOf('</think>') + 8
  )
  const $ = cheerio.load(html)
  $('think').remove()
  return $.text()
    .replace('html', '')
    .replace('txt', '')
    .replace('text', '')
    .replace('markdown', '')
    .replace('plaintext', '')
    .replace('plain', '')
    .replace(/`/g, '')
    .replace(/#/g, '')
    .replace(/\*/g, '')
    .replace(/<!DOCTYPE html[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .replace(/<head[^>]*>/gi, '')
    .replace(/<\/head>/gi, '')
    .trim()
}

export const purifyHtmlThink = (html: string): string => {
  html = html.slice(
    html.indexOf('</think>') < 0 ? 0 : html.indexOf('</think>') + 8
  )
  const $ = cheerio.load(html)
  $('think').remove()
  return $.html()
    .replace('txt', '')
    .replace('text', '')
    .replace('markdown', '')
    .replace('plaintext', '')
    .replace('plain', '')
    .replace(/`/g, '')
    .replace(/#/g, '')
    .replace(/\*/g, '')
    .trim()
}

export const purifyBracket = (html: string): string => {
  return html.replace(/[(（].*?[)）]/g, '')
}
