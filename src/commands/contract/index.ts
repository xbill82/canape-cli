import path from 'path';
import {Args, Command, Flags} from '@oclif/core'
import conf from '../../services/config.js'
import { getBackend, getThrottle } from '../../services/notion.backend.js'
import { fetchDealById } from '../../use-cases/notionDeal.js'
import { ContractGenerator } from '../../domain/contractGenerator.js'

export default class Contract extends Command {
  static args = {
    id: Args.string({description: 'The Notion ID of the deal to generate the contract for', required: true}),
  }

  static description = 'Generate a contract for a specific deal'

  static examples = [
    `<%= config.bin %> <%= command.id %> <dealId>`,
  ]

  static flags = {
    templatePath: Flags.string({ description: 'the path to the contract template', char: 't'}),
    outputFormat: Flags.string({ description: 'the format for the output file (pdf, html)', char: 'f', default: 'pdf', options: ['pdf', 'html']}),
    outputPath: Flags.string({ description: 'the path where the generated contract will be saved to (defaults to ~/Downloads)', char: 'o'})
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Contract)
    const backend = getBackend(conf.notionApiKey);
    const throttle = getThrottle()

    this.log(`📜 Generating contract for Deal with ID ${args.id}...`);

    const deal = await fetchDealById(backend, throttle, args.id);

    this.log(`✅ Deal fetched!`)

    this.debug(JSON.stringify(deal, null, 2))

    const templatePath = flags.templatePath ? path.resolve(flags.templatePath) : conf.templatePath;
    const generator = new ContractGenerator(deal, templatePath, flags.outputPath);
    const outputPath = await generator.generateContract(flags.outputFormat);

    this.log(`✅ Contract generated to ${outputPath}`)
  }
}