const path = require('path')

const cache = require('@actions/tool-cache')

const exec = require('../util/exec')
const log = require('../util/log')

function isWindows () {
  return process.platform === 'win32'
}

const platformDependentImpl = isWindows()
  ? require('./windows')
  : require('./nix')

const Jabba = {
  _deps: {
    path,
    process,
    cache,
    exec
  },

  Jabba () {
    return this
  },

  async retrieveDistribution (distributionExpression) {
    await this.installJabba()

    log.info('Installed jabba.')

    await this.installJava(distributionExpression)

    log.info(`Installed distribution: ${distributionExpression}`)

    return await this.getPathToJava()
  },

  async installJava (distributionExpression) {
    await this.runJabba('install', [distributionExpression])
  },

  async getPathToJava () {
    const distributionName = await this.runJabba('ls')

    log.info(`Local name of distribution is: ${distributionName}`)

    return await this.runJabba('which', [distributionName])
  },

  async runJabba (command, args) {
    const output = await this._deps.exec.execAndGrabStdout(this.jabbaPath(), [command, ...(args || [])])

    return output.trim()
  }
}

Object.setPrototypeOf(Jabba, platformDependentImpl)

Jabba.create = function create () {
  return Object.create(Jabba).Jabba()
}

module.exports = Jabba
