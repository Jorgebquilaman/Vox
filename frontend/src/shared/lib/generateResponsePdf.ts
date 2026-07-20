import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { ResponsePdfData, PdfAnswerItem } from '../types'

function answerText(item: PdfAnswerItem): string {
  if (item.isSection) return `[${item.questionTitle}]`
  if (item.selectedAlternative) return item.selectedAlternative
  if (item.textValue) return item.textValue
  if (item.fileName) return `(archivo: ${item.fileName})`
  return '(sin respuesta)'
}

export default async function generateResponsePdf(data: ResponsePdfData) {
  const mergedPdf = await PDFDocument.create()
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold)
  const fontSize = 10

  if (data.originalPdfBase64) {
    const origPdf = await PDFDocument.load(data.originalPdfBase64, { ignoreEncryption: true })
    const hasPositions = data.answers.some(a => a.pdfPageNumber != null && a.pdfPositionY != null)

    if (hasPositions) {
      const pageCount = origPdf.getPageCount()
      const answersByPage = new Map<number, PdfAnswerItem[]>()
      for (const a of data.answers) {
        if (a.pdfPageNumber == null || a.pdfPositionY == null) continue
        const page = a.pdfPageNumber - 1
        if (!answersByPage.has(page)) answersByPage.set(page, [])
        answersByPage.get(page)!.push(a)
      }

      for (let i = 0; i < pageCount; i++) {
        const [origPage] = await mergedPdf.copyPages(origPdf, [i])
        const { width: pw, height: ph } = origPage.getSize()

        const pageAnswers = answersByPage.get(i) ?? []
        const grouped = new Map<string, PdfAnswerItem[]>()
        for (const a of pageAnswers) {
          const key = `${a.pdfPositionY}-${a.pdfPositionX ?? 15}`
          if (!grouped.has(key)) grouped.set(key, [])
          grouped.get(key)!.push(a)
        }

        for (const [, group] of grouped) {
          const first = group[0]
          const x = first.pdfPositionX != null ? (first.pdfPositionX / 100) * pw : pw * 0.15
          let y = ph - ((first.pdfPositionY! / 100) * ph) - fontSize
          const answers = [...new Set(group.map(answerText))].join(', ')
          const label = `${group[0].questionTitle}: ${answers}`

          origPage.drawText(label, {
            x,
            y,
            size: fontSize,
            font: fontBold,
            color: rgb(0.11, 0.23, 0.37),
            maxWidth: pw * 0.7
          })
        }

        mergedPdf.addPage(origPage)
      }
    } else {
      const pages = await mergedPdf.copyPages(origPdf, origPdf.getPageIndices())
      pages.forEach(p => mergedPdf.addPage(p))
    }
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  const contentW = pageW - margin * 2
  let y = margin

  const verifyUrl = `${window.location.origin}/verificar/${data.responseId}`

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 1,
    color: { dark: '#1e3a5f', light: '#ffffff' }
  })

  doc.setFillColor(30, 58, 95)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text(data.surveyTitle, margin, 17)

  y = 38

  doc.setTextColor(30, 58, 95)
  doc.setFontSize(11)
  doc.text(`Estudiante: ${data.respondentName}`, margin, y)
  y += 6
  doc.text(`Email: ${data.respondentEmail}`, margin, y)
  y += 6
  doc.text(`Fecha: ${new Date(data.respondedAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, y)
  y += 10

  const qrSize = 30
  const qrX = pageW - margin - qrSize
  const qrY = y - 2

  try {
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text('Escanear para verificar', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' })
  } catch {
    // QR no disponible
  }

  const bodyRows: (string | number)[][] = []
  for (const a of data.answers) {
    if (a.isSection) {
      bodyRows.push([`[${a.questionTitle}]`, '', ''])
      continue
    }
    const value = a.selectedAlternative || a.textValue || a.fileName || ''
    const label = a.groupInstance != null ? `${a.questionTitle} (#${a.groupInstance + 1})` : a.questionTitle
    bodyRows.push([label, value, a.score != null ? String(a.score) : ''])
  }

  if (bodyRows.length > 0) {
    autoTable(doc, {
      startY: Math.max(y + 2, qrY + qrSize + 10),
      head: [['Pregunta', 'Respuesta', 'Pts']],
      body: bodyRows,
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: contentW * 0.5 },
        1: { cellWidth: contentW * 0.35 },
        2: { cellWidth: contentW * 0.15, halign: 'center' }
      },
      didParseCell: data => {
        if (typeof data.cell.raw === 'string' && data.cell.raw.startsWith('[')) {
          data.cell.styles.fillColor = [241, 245, 249]
          data.cell.styles.textColor = [100, 116, 139]
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fontSize = 8
        }
      }
    })
  }

  const jspdfBytes = doc.output('arraybuffer')
  const jspdfDoc = await PDFDocument.load(jspdfBytes)
  const jspdfPages = await mergedPdf.copyPages(jspdfDoc, jspdfDoc.getPageIndices())
  jspdfPages.forEach(p => mergedPdf.addPage(p))

  const mergedBytes = await mergedPdf.save()
  const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `respuesta-${data.surveyTitle.replace(/\s+/g, '-')}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
