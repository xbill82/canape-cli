import dayjs from 'dayjs'
import Handlebars from 'handlebars'
import registerHelpers from 'handlebars-helpers'
import _ from 'lodash'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import puppeteer from 'puppeteer'

import {Deal} from './deal.js'

const tmpPath = path.join('/', 'tmp')
const defaultOutputPath = path.join(os.homedir(), 'Downloads')
const pdfMargin = '40px'

export class ContractGenerator {
  private contractTemplate: HandlebarsTemplateDelegate
  private deal: Deal
  private outputFileName = 'canapeContract.html'
  private outputPath: string

  constructor(deal: Deal, templatePath: string, outputPath?: string) {
    this.deal = deal
    registerHelpers()

    this.contractTemplate = Handlebars.compile(fs.readFileSync(templatePath).toString())
    this.outputFileName = `${dayjs(deal.date).format('YYYYMMDD')}-${_.camelCase(deal.organization.name)}-contract`
    this.outputPath = outputPath ? path.resolve(path.join(process.cwd(), outputPath)) : defaultOutputPath
  }

  public async generateContract(format: string = 'pdf') {
    const generatedContract = this.contractTemplate(this.deal)

    const contractHTMLPath = path.join(format === 'pdf' ? tmpPath : this.outputPath, `${this.outputFileName}.html`)
    fs.writeFileSync(contractHTMLPath, generatedContract)

    if (format === 'pdf') {
      return this.generatePDF(contractHTMLPath)
    }

    return contractHTMLPath
  }

  private async generatePDF(htmlPath: string) {
    const browser = await puppeteer.launch({headless: true})
    const page = await browser.newPage()
    await page.goto(`file://${path.resolve(htmlPath)}`, {waitUntil: 'networkidle0'})
    const pdf = await page.pdf({
      format: 'A4',
      margin: {bottom: pdfMargin, left: pdfMargin, right: pdfMargin, top: pdfMargin},
    })

    await browser.close()
    const outputPath = path.join(this.outputPath, `${this.outputFileName}.pdf`)
    fs.writeFileSync(outputPath, pdf)

    return outputPath
  }
}
