import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'

/**
 * Export an HTML string as a PDF-ready document.
 * - On Android (Capacitor native): saves to Downloads then opens share sheet
 * - On browser: opens a print window
 */
export async function exportHtmlAsPdf(htmlContent: string, filename: string) {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${filename}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #0f172a; background: #fff; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>${htmlContent}</body>
</html>`

  if (Capacitor.isNativePlatform()) {
    // Android: write HTML file then share so user can open/print/save as PDF
    const base64 = btoa(unescape(encodeURIComponent(fullHtml)))
    const htmlFilename = filename.replace(/\.pdf$/i, '') + '.html'
    await Filesystem.writeFile({
      path: htmlFilename,
      data: base64,
      directory: Directory.Cache,
    })
    const fileUri = await Filesystem.getUri({
      path: htmlFilename,
      directory: Directory.Cache,
    })
    await Share.share({
      title: filename,
      text: `${filename} — tap to open and print/save as PDF`,
      url: fileUri.uri,
      dialogTitle: `Save / Print ${filename}`,
    })
  } else {
    // Browser: open in new window and trigger print
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(fullHtml)
      win.document.close()
      win.onload = () => win.print()
    }
  }
}
