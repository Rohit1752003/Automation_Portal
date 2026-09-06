const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const generateCertificateContent = require("./aiService");
const env = require("../config/environment");

// ---- layout tuning ----
const PAGE_MARGIN = 50;
const BODY_FONT_MAX = 12;
const BODY_FONT_MIN = 8;

/**
 * Renders `text` inside a fixed box, shrinking the font size step-by-step
 * until it fits `maxHeight`, and truncating with an ellipsis as a last
 * resort. This is what stops the AI-generated Bonafide/Leaving-Certificate
 * body from spilling onto a second page.
 */
function fitTextInBox(doc, text, { x, y, width, maxHeight, align = "justify", indent = 0, font = "Helvetica" }) {
  let fontSize = BODY_FONT_MAX;
  doc.font(font);

  while (fontSize >= BODY_FONT_MIN) {
    doc.fontSize(fontSize);
    const height = doc.heightOfString(text, { width, align, indent });
    if (height <= maxHeight) break;
    fontSize -= 1;
  }

  doc.fontSize(Math.max(fontSize, BODY_FONT_MIN));
  doc.text(text, x, y, { width, align, indent, height: maxHeight, ellipsis: true });
}

const generatePdf = async (request) => {
  return new Promise(async (resolve, reject) => {
    let filePath = "";

    try {
      const student = request.student || {};
      const type = request.type;
      const studentId = student.student_id || "N/A";

      if (request.status === "Approved" && !request.certificateNumber) {
        throw new Error("Certificate number missing");
      }

      let aiContent = "";
      if (type === "Bonafide" || type === "Leaving Certificate") {
        aiContent = await generateCertificateContent(request);
      }

      // =========================
      // GENERATED DIRECTORY
      // =========================
      const generatedFolder = env.GENERATED_DIR || path.join(__dirname, "..", "generated");
      if (!fs.existsSync(generatedFolder)) {
        fs.mkdirSync(generatedFolder, { recursive: true });
      }

      const fileName = `${Date.now()}_${type.replace(/\s+/g, "_")}_${studentId}.pdf`;
      filePath = path.join(generatedFolder, fileName);

      // bufferPages lets us assert afterwards that we really only produced
      // one page — a safety net on top of the fixed layout below.
      const doc = new PDFDocument({ margin: PAGE_MARGIN, bufferPages: true });
      const stream = fs.createWriteStream(filePath);

      stream.on("error", (err) => {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(err);
      });

      stream.on("finish", () => {
        resolve(`${env.SERVER_URL}/generated/${encodeURIComponent(fileName)}`);
      });

      doc.pipe(stream);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const contentWidth = pageWidth - PAGE_MARGIN * 2;

      // =========================
      // BORDER
      // =========================
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40).lineWidth(2).stroke();

      // =========================
      // WATERMARK
      // =========================
      doc.save();
      doc.opacity(0.08);
      doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
      doc.fontSize(70).font("Helvetica-Bold");
      doc.text("SKNCOE OFFICIAL", -100, pageHeight / 2 - 50, {
        width: pageWidth + 200,
        align: "center",
      });
      doc.restore();

      // =========================
      // HEADER — fixed y-cursor, no moveDown() drift
      // =========================
      const logoPath = path.join(__dirname, "..", "assets", "college_logo.jpg");
      const stampPath = path.join(__dirname, "..", "assets", "stamp.jpeg");

      const headerTop = 35;
      let y = headerTop;

      if (fs.existsSync(logoPath)) {
        const logoWidth = 90;
        // measure the real image instead of guessing its height with
        // moveDown(5) — this was silently misaligning the header before
        const { width: iw, height: ih } = doc.openImage(logoPath);
        const logoHeight = (logoWidth / iw) * ih;
        doc.image(logoPath, (pageWidth - logoWidth) / 2, headerTop, { width: logoWidth });
        y = headerTop + logoHeight;
      }
      y += 10;

      doc.font("Helvetica-Bold").fontSize(16)
        .text("SMT. KASHIBAI NAVALE COLLEGE OF ENGINEERING", PAGE_MARGIN, y, {
          width: contentWidth,
          align: "center",
        });
      y += 22;

      doc.font("Helvetica").fontSize(10).fillColor("#444")
        .text("NAAC Accredited | ISO Certified Institution", PAGE_MARGIN, y, {
          width: contentWidth,
          align: "center",
        });
      doc.fillColor("black");
      y += 16;

      doc.font("Helvetica").fontSize(11);
      [
        "(Affiliated to Savitribai Phule Pune University & Approved by AICTE)",
        "[Accredited by NBA w.e.f. 1/1/2013]",
        "S.No.44/1, Off Sinhgad Road Vadgaon(Bk), Pune-411041.",
      ].forEach((line) => {
        doc.text(line, PAGE_MARGIN, y, { width: contentWidth, align: "center" });
        y += 15;
      });
      y += 20;

      // =========================
      // METADATA
      // =========================
      doc.font("Helvetica").fontSize(11);
      [
        `Certificate No : ${request.certificateNumber || "N/A"}`,
        `Issued On : ${
          request.approvedDate
            ? new Date(request.approvedDate).toLocaleDateString("en-GB")
            : new Date().toLocaleDateString("en-GB")
        }`,
        `Verification ID : ${request.verificationId || "N/A"}`,
        `Generated At : ${new Date().toLocaleString("en-IN")}`,
      ].forEach((line) => {
        doc.text(line, PAGE_MARGIN, y, { width: contentWidth, align: "right" });
        y += 14;
      });
      y += 20;

      // =========================
      // Reserve the footer zone BEFORE laying out the body, so the body
      // can never push into it (this is what was pushing content to a
      // 2nd/3rd page).
      // =========================
      const footerBlockHeight = 130;
      const footerY = pageHeight - PAGE_MARGIN - footerBlockHeight;

      // =========================
      // BODY
      // =========================
      if (type === "Bonafide" || type === "Leaving Certificate") {
        doc.font("Helvetica-Bold").fontSize(16)
          .text(type.toUpperCase(), PAGE_MARGIN, y, {
            width: contentWidth,
            align: "center",
            underline: true,
          });
        y += 30;

        const safeContent =
          aiContent && aiContent.length > 2000
            ? aiContent.substring(0, 2000)
            : aiContent || "This is to certify that the details provided are verified and authentic.";

        const availableHeight = footerY - y - 10;

        fitTextInBox(doc, safeContent, {
          x: PAGE_MARGIN,
          y,
          width: contentWidth,
          maxHeight: availableHeight,
          align: "justify",
          indent: 40,
        });
      } else {
        doc.fontSize(18).font("Helvetica-Bold")
          .text(type.toUpperCase(), PAGE_MARGIN, y, {
            width: contentWidth,
            align: "center",
            underline: true,
          });
        y += 30;

        doc.fontSize(12).font("Helvetica");
        [
          `Student Name: ${student.name || "N/A"}`,
          `Student ID: ${student.student_id || "N/A"}`,
          `Department: ${student.department || "N/A"}`,
        ].forEach((line) => {
          doc.text(line, PAGE_MARGIN, y, { width: contentWidth });
          y += 16;
        });
        y += 10;

        doc.text("This request has been approved by the College Administration.", PAGE_MARGIN, y, {
          width: contentWidth,
        });
      }

      // =========================
      // FOOTER DISCLAIMER
      // =========================
      doc.fontSize(9).fillColor("red")
        .text("Any alteration to this certificate invalidates its authenticity.", 40, footerY, {
          align: "center",
          width: pageWidth - 80,
        });
      doc.fillColor("black");

      // =========================
      // QR CODE — opens the frontend verification page, not the API
      // =========================
      const verifyUrl = `${env.FRONTEND_URL}/verify/${request.verificationId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
      });

      doc.image(qrCodeDataUrl, 40, footerY + 25, { width: 80 });

      doc.fontSize(8).font("Helvetica-Oblique").fillColor("#555")
        .text("Scan to verify authenticity", 20, footerY + 98, {
          width: 110,
          align: "center",
          lineBreak: false, // never wrap — a wrap here is what pushes content onto page 2
        });
      doc.fillColor("black");

      // Shortened label + a smaller font + lineBreak:false guarantees this
      // stays a single line no matter how long the hash is, so it can
      // never trigger PDFKit's auto page-break near the bottom margin.
      doc.fontSize(6).font("Helvetica").fillColor("#666")
        .text(`ID: ${request.verificationId}`, 10, footerY + 110, {
          width: 130,
          align: "center",
          lineBreak: false,
        });
      doc.fillColor("black");

      // =========================
      // STAMP & SIGNATURE
      // =========================
      if (fs.existsSync(stampPath)) {
        doc.image(stampPath, 420, footerY + 15, { width: 90 });
      }

      const signatureWidth = pageWidth - 40 - 300; // right edge matches the outer border
      doc.fontSize(11).font("Helvetica")
        .text("Registrar", 300, footerY + 85, { width: signatureWidth, align: "right" })
        .text("SMT. KASHIBAI NAVALE COLLEGE OF ENGINEERING", 300, footerY + 100, {
          width: signatureWidth,
          align: "right",
        });

      // Safety net: if this ever fires, something in the layout above
      // still overflowed — log it instead of silently shipping a
      // multi-page certificate.
      const pageCount = doc.bufferedPageRange().count;
      if (pageCount > 1) {
        console.warn(`[generatePdf] Expected 1 page, got ${pageCount} for ${fileName}.`);
      }

      doc.end();
    } catch (error) {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(error);
    }
  });
};

module.exports = generatePdf;