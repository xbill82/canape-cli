// contractGenerator.ts

import dayjs from 'dayjs'
import 'dayjs/locale/fr.js'
import Handlebars from 'handlebars'
import registerHelpers from 'handlebars-helpers'
import _ from 'lodash'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import puppeteer from 'puppeteer'

import {Deal} from '../domain/deal.js'
import {Gig} from '../domain/gig.js'

// Constants
const tmpPath = path.join('/', 'tmp')
const defaultOutputPath = path.join(os.homedir(), 'Downloads')
const pdfMargin = '40px'

// Initialize Handlebars Helpers
const initializeHandlebars = () => {
  registerHelpers()
  Handlebars.registerHelper('formatDate', (timestamp: string) => dayjs(timestamp).locale('fr').format('D MMMM YYYY'))
  Handlebars.registerHelper('formatTime', (timestamp: string) => dayjs(timestamp).locale('fr').format('HH[h]mm'))
  Handlebars.registerHelper('uniqTitles', (gigs: Gig[]) => _.uniq(gigs.map((g) => g.showTitle)))
}

// Compile Handlebars Template
const compileTemplate = (templatePath: string): Handlebars.TemplateDelegate => {
  const templateContent = fs.readFileSync(templatePath, 'utf8')
  return Handlebars.compile(templateContent)
}

// Generate Output File Name
const generateOutputFileName = (deal: Deal): string => {
  const datePart = dayjs(deal.date).format('YYYYMMDD')
  const namePart = _.camelCase(deal.organization.name)
  return `${datePart}-${namePart}-contract`
}

// Resolve Output Path
const resolveOutputPath = (outputPath?: string): string =>
  outputPath ? path.resolve(path.join(process.cwd(), outputPath)) : defaultOutputPath

// Write HTML to File
const writeHTMLToFile = (htmlContent: string, filePath: string): void => {
  fs.writeFileSync(filePath, htmlContent, 'utf8')
}

// Generate PDF from HTML
const generatePDF = async (htmlPath: string, outputPath: string): Promise<string> => {
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page.goto(`file://${path.resolve(htmlPath)}`, {waitUntil: 'networkidle0'})
  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: {bottom: pdfMargin, left: pdfMargin, right: pdfMargin, top: pdfMargin},
  })
  await browser.close()
  fs.writeFileSync(outputPath, pdfBuffer)
  return outputPath
}

export type outputFormat = 'html' | 'pdf'

// Generate Contract (HTML or PDF)
const generateContract = async (
  deal: Deal,
  templatePath: string,
  options?: {format?: outputFormat; outputPath?: string},
): Promise<string> => {
  const {format = 'pdf', outputPath} = options || {}

  // Initialize Handlebars and compile template
  initializeHandlebars()
  const template = compileTemplate(templatePath)

  // Generate output file name and resolve paths
  const outputFileName = generateOutputFileName(deal)
  const resolvedOutputPath = resolveOutputPath(outputPath)
  const htmlFilePath = path.join(format === 'pdf' ? tmpPath : resolvedOutputPath, `${outputFileName}.html`)

  // Generate HTML content and write to file
  const htmlContent = template(deal)
  writeHTMLToFile(htmlContent, htmlFilePath)

  if (format === 'pdf') {
    const pdfFilePath = path.join(resolvedOutputPath, `${outputFileName}.pdf`)
    return generatePDF(htmlFilePath, pdfFilePath)
  }

  return htmlFilePath
}

export {generateContract}
