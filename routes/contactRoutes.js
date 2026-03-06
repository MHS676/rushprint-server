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

// Generate a short unique reference token
function generateToken() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF-${ts}-${rand}`;
}

// POST /api/contact  (public)
router.post("/", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ success: false, message: "Email and message are required." });
  }

  const token = generateToken();
  const contactEmail = process.env.QUOTE_EMAIL || process.env.GMAIL_USER;
  const subjectLine = subject ? subject : "New Contact Inquiry";

  // Email sent to RushPrint team
  const teamHtml = `
<div style="font-family:sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#1a1a2e;padding:24px 30px;text-align:center">
    <h1 style="color:#ff6b35;margin:0;font-size:26px">RushPrint</h1>
    <p style="color:rgba(255,255,255,.6);margin:4px 0 0;font-size:13px">New Contact Message</p>
  </div>
  <div style="padding:32px 30px;background:#fff">
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 16px;margin-bottom:24px">
      <strong style="color:#0369a1">Reference Token:</strong>
      <span style="font-size:18px;font-weight:700;color:#1a1a2e;margin-left:8px;letter-spacing:1px">${token}</span>
    </div>

    <h2 style="color:#1a1a2e;margin:0 0 20px;font-size:18px">📩 ${subjectLine}</h2>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr style="background:#f9fafb">
        <td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb;width:35%">Name</td>
        <td style="padding:12px 16px;color:#555;border:1px solid #e5e7eb">${name || "—"}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb">Email</td>
        <td style="padding:12px 16px;border:1px solid #e5e7eb">
          <a href="mailto:${email}" style="color:#2563eb">${email}</a>
        </td>
      </tr>
      ${phone ? `<tr style="background:#f9fafb"><td style="padding:12px 16px;font-weight:700;color:#374151;border:1px solid #e5e7eb">Phone</td><td style="padding:12px 16px;color:#555;border:1px solid #e5e7eb">${phone}</td></tr>` : ""}
    </table>

    <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px">
      <strong style="color:#374151;display:block;margin-bottom:8px">Message:</strong>
      <p style="margin:0;color:#374151;line-height:1.7;white-space:pre-wrap">${message}</p>
    </div>

    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px">
      <p style="margin:0;color:#047857;font-size:13px">📩 Reply to <a href="mailto:${email}" style="color:#047857;font-weight:700">${email}</a> to respond to this inquiry.</p>
    </div>
  </div>
  <div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;background:#f8f9fa">
    Token: ${token} &bull; © ${new Date().getFullYear()} RushPrint
  </div>
</div>`;

  // Confirmation email sent to user
  const userHtml = `
<div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#1a1a2e;padding:24px 30px;text-align:center">
    <h1 style="color:#ff6b35;margin:0;font-size:26px">RushPrint</h1>
    <p style="color:rgba(255,255,255,.6);margin:4px 0 0;font-size:13px">Message Received</p>
  </div>
  <div style="padding:32px 30px;background:#fff">
    <h2 style="color:#1a1a2e;margin:0 0 16px">Hi ${name || "there"}, we got your message! 👋</h2>
    <p style="color:#555;line-height:1.7">Thank you for contacting RushPrint. We've received your message and will get back to you as soon as possible.</p>

    <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:10px;padding:20px;text-align:center;margin:24px 0">
      <p style="margin:0 0 8px;color:#0369a1;font-weight:600;font-size:13px">YOUR REFERENCE TOKEN</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#1a1a2e;letter-spacing:2px">${token}</p>
      <p style="margin:8px 0 0;color:#64748b;font-size:12px">Use this token when following up on your inquiry</p>
    </div>

    <p style="color:#555;font-size:14px;">We typically respond within a few hours on business days.</p>
  </div>
  <div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;background:#f8f9fa">
    © ${new Date().getFullYear()} RushPrint. This is an automated confirmation.
  </div>
</div>`;

  try {
    const transporter = createTransporter();

    // Send to team
    await transporter.sendMail({
      from: `"RushPrint Contact" <${process.env.GMAIL_USER}>`,
      to: contactEmail,
      replyTo: email,
      subject: `[${token}] ${subjectLine} — from ${name || email}`,
      html: teamHtml,
    });

    // Send confirmation to user
    await transporter.sendMail({
      from: `"RushPrint" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Your RushPrint inquiry received — Token: ${token}`,
      html: userHtml,
    });

    res.json({ success: true, token, message: "Message sent successfully!" });
  } catch (err) {
    console.error("Contact email error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send message. Please try again." });
  }
});

module.exports = router;
