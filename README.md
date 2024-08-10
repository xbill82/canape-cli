canape-cli
=================

A CLI to automate tasks at Le Canapé dans l'Arbre


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/canape-cli.svg)](https://npmjs.org/package/canape-cli)
[![Downloads/week](https://img.shields.io/npm/dw/canape-cli.svg)](https://npmjs.org/package/canape-cli)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g canape-cli
$ canape COMMAND
running command...
$ canape (--version)
canape-cli/0.0.0 darwin-arm64 node-v20.15.0
$ canape --help [COMMAND]
USAGE
  $ canape COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`canape contract ID`](#canape-contract-id)
* [`canape help [COMMAND]`](#canape-help-command)
* [`canape plugins`](#canape-plugins)
* [`canape plugins add PLUGIN`](#canape-plugins-add-plugin)
* [`canape plugins:inspect PLUGIN...`](#canape-pluginsinspect-plugin)
* [`canape plugins install PLUGIN`](#canape-plugins-install-plugin)
* [`canape plugins link PATH`](#canape-plugins-link-path)
* [`canape plugins remove [PLUGIN]`](#canape-plugins-remove-plugin)
* [`canape plugins reset`](#canape-plugins-reset)
* [`canape plugins uninstall [PLUGIN]`](#canape-plugins-uninstall-plugin)
* [`canape plugins unlink [PLUGIN]`](#canape-plugins-unlink-plugin)
* [`canape plugins update`](#canape-plugins-update)

## `canape contract ID`

Generate a contract for a specific deal

```
USAGE
  $ canape contract ID [-t <value>] [-f pdf|html] [-o <value>]

ARGUMENTS
  ID  The Notion ID of the deal to generate the contract for

FLAGS
  -f, --outputFormat=<option>  [default: pdf] the format for the output file (pdf, html)
                               <options: pdf|html>
  -o, --outputPath=<value>     the path where the generated contract will be saved to (defaults to ~/Downloads)
  -t, --templatePath=<value>   the path to the contract template

DESCRIPTION
  Generate a contract for a specific deal

EXAMPLES
  $ canape contract My-super-deal-69b0e4f5886e4499839aaa469b2547b0
```

_See code: [src/commands/contract/index.ts](https://github.com/xbill82/canape-cli/blob/v0.0.0/src/commands/contract/index.ts)_

## `canape help [COMMAND]`

Display help for canape.

```
USAGE
  $ canape help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for canape.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.7/src/commands/help.ts)_

## `canape plugins`

List installed plugins.

```
USAGE
  $ canape plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ canape plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.9/src/commands/plugins/index.ts)_

## `canape plugins add PLUGIN`

Installs a plugin into canape.

```
USAGE
  $ canape plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into canape.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the CANAPE_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the CANAPE_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ canape plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ canape plugins add myplugin

  Install a plugin from a github url.

    $ canape plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ canape plugins add someuser/someplugin
```

## `canape plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ canape plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ canape plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.9/src/commands/plugins/inspect.ts)_

## `canape plugins install PLUGIN`

Installs a plugin into canape.

```
USAGE
  $ canape plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into canape.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the CANAPE_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the CANAPE_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ canape plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ canape plugins install myplugin

  Install a plugin from a github url.

    $ canape plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ canape plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.9/src/commands/plugins/install.ts)_

## `canape plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ canape plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ canape plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.9/src/commands/plugins/link.ts)_

## `canape plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ canape plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ canape plugins unlink
  $ canape plugins remove

EXAMPLES
  $ canape plugins remove myplugin
```

## `canape plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ canape plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.9/src/commands/plugins/reset.ts)_

## `canape plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ canape plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ canape plugins unlink
  $ canape plugins remove

EXAMPLES
  $ canape plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.9/src/commands/plugins/uninstall.ts)_

## `canape plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ canape plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ canape plugins unlink
  $ canape plugins remove

EXAMPLES
  $ canape plugins unlink myplugin
```

## `canape plugins update`

Update installed plugins.

```
USAGE
  $ canape plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.3.9/src/commands/plugins/update.ts)_
<!-- commandsstop -->
