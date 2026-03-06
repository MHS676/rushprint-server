const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

function createTransporter() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASS,
        },
    });
}

// POST /api/quote  (public – no auth needed)
router.post("/", async (req, res) => {
    const { name, email, phone, product, sku, quantity, color, totalCost, unitPrice, message } = req.body;

    if (!email || !product || !quantity) {
        return res.status(400).json({ success: false, message: "Email, product, and quantity are required." });
    }

    const quoteEmail = process.env.QUOTE_EMAIL || process.env.GMAIL_USER;

    const html = `
    <div style="font-family:sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1a1a2e;padding:24px 30px;text-align:center">
        <h1 style="color:#ff6b35;margin:0;font-size:26px">RushPrint</h1>
        <p style="color:rgba(255,255,255,.6);margin:4px 0 0;font-size:13px">New Quote Request</p>
      </div>
      <div style="padding:32px 30px;background:#fff">
        <h2 style="color:#1a1a2e;margin:0 0 24px;font-size:20px">📋 Quote Request Details</h2>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr style="background:#f9fafb">
            <td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb;width:40%">Product</td>
            <td style="padding:12px 16px;color:#1a1a2e;border:1px solid #e5e7eb;font-weight:600">${product}</td>
          </tr>
          ${sku ? `<tr><td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb">SKU</td><td style="padding:12px 16px;color:#555;border:1px solid #e5e7eb">${sku}</td></tr>` : ""}
          <tr style="background:#f9fafb">
            <td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb">Quantity</td>
            <td style="padding:12px 16px;color:#1a1a2e;border:1px solid #e5e7eb;font-weight:600">${quantity}</td>
          </tr>
          ${color ? `<tr><td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb">Color</td><td style="padding:12px 16px;color:#555;border:1px solid #e5e7eb">${color}</td></tr>` : ""}
          ${unitPrice ? `<tr style="background:#f9fafb"><td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb">Unit Price</td><td style="padding:12px 16px;color:#d97706;border:1px solid #e5e7eb;font-weight:700">$${Number(unitPrice).toFixed(2)}</td></tr>` : ""}
          ${totalCost ? `<tr><td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb">Est. Total</td><td style="padding:12px 16px;color:#059669;border:1px solid #e5e7eb;font-weight:700;font-size:16px">$${Number(totalCost).toFixed(2)}</td></tr>` : ""}
        </table>

        <h3 style="color:#1a1a2e;margin:0 0 16px;font-size:16px">👤 Customer Details</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr style="background:#f9fafb">
            <td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb;width:40%">Name</td>
            <td style="padding:12px 16px;color:#555;border:1px solid #e5e7eb">${name || "—"}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb">Email</td>
            <td style="padding:12px 16px;border:1px solid #e5e7eb"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td>
          </tr>
          ${phone ? `<tr style="background:#f9fafb"><td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb">Phone</td><td style="padding:12px 16px;color:#555;border:1px solid #e5e7eb">${phone}</td></tr>` : ""}
        </table>

        ${message ? `<div style="background:#fef9ec;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px"><strong style="color:#92400e">Message:</strong><p style="margin:8px 0 0;color:#374151;line-height:1.6">${message}</p></div>` : ""}

        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px">
          <p style="margin:0;color:#047857;font-size:13px">📩 Reply directly to <a href="mailto:${email}" style="color:#047857;font-weight:700">${email}</a> to respond to this quote request.</p>
        </div>
      </div>
      <div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;background:#f8f9fa">
        © ${new Date().getFullYear()} RushPrint. Automated quote request notification.
      </div>
    </div>
  `;

    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"RushPrint Quotes" <${process.env.GMAIL_USER}>`,
            to: quoteEmail,
            replyTo: email,
            subject: `New Quote Request: ${product} × ${quantity}`,
            html,
        });
        res.json({ success: true, message: "Your request has been sent! We'll contact you shortly." });
    } catch (err) {
        console.error("Quote email error:", err.message);
        res.status(500).json({ success: false, message: "Failed to send request. Please try again." });
    }
});

module.exports = router;
