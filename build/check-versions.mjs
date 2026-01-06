import semver from 'semver'
import chalk from 'chalk'

import packageConfig from '../package.json' with { type: 'json' }

var versionRequirements = [
  {
    name: 'node',
    currentVersion: semver.clean(process.version),
    versionRequirement: packageConfig.engines.node,
  },
]

export default function () {
  const warnings = []
  for (let i = 0; i < versionRequirements.length; i++) {
    const mod = versionRequirements[i]
    if (!semver.satisfies(mod.currentVersion, mod.versionRequirement)) {
      warnings.push(
        mod.name +
          ': ' +
          chalk.red(mod.currentVersion) +
          ' should be ' +
          chalk.green(mod.versionRequirement),
      )
    }
  }

  if (warnings.length) {
    console.warn(
      chalk.yellow(
        '\nTo use this template, you must update following to modules:\n',
      ),
    )
    for (let i = 0; i < warnings.length; i++) {
      const warning = warnings[i]
      console.warn('  ' + warning)
    }
    console.warn()
    process.exit(1)
  }
}
