export const hostedModePlugin = () => {
  return {
    name: 'hosted-mode-plugin',
    transformIndexHtml(html) {
      if (process.env.PLEROMAFE_HOSTED_MODE) {
        const replacement = [
          '<title>PleromaFE</title>',
          '<link rel="manifest" href="/static/PWA/manifest.json">',
          '<meta name="theme-color" content="#1e2734">',
          '<link rel="apple-touch-icon" href="/static/PWA/192_bg.png">',
          '<link rel="icon" href="/static/PWA/192.png">'
        ].map((x) => '    ' + x)

        return html.replace(
          '<!--server-generated-meta-->',
          replacement.join('\n'),
        )
      } else {
        return html
      }
    },
  }
}
