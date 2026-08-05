import childProcess from 'node:child_process'

export const getCommitHash = () => {
  const subst = '$Format:%h$'
  if (!/Format:/.exec(subst)) {
    return subst
  } else {
    try {
      return childProcess
        .execSync(
          'PATH=/usr/bin:/bin:/usr/local/bin:/sbin:/usr/sbin git rev-parse --short HEAD',
        )
        .toString()
        .trim()
    } catch (e) {
      console.error('Failed run git:', e)
      return 'UNKNOWN'
    }
  }
}
