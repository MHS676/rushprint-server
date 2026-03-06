const express = require("express");
const nodemailer = require("nodemailer");
const pool = require("../db");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();

// Create reusable transporter
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });
}

// POST /api/admin/send-email  (protected)
// Sends one email to all subscribers (BCC) in a single send
router.post("/send-email", verifyToken, async (req, res) => {
  const { subject, html, testEmail } = req.body;

  if (!subject || !html) {
    return res.status(400).json({ success: false, message: "Subject and body are required." });
  }

  try {
    let recipients = [];

    if (testEmail) {
      // Test mode: send only to provided address
      recipients = [testEmail];
    } else {
      // Blast to all subscribers
      const result = await pool.query("SELECT email FROM subscribers");
      recipients = result.rows.map((r) => r.email);
    }

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, message: "No subscribers found." });
    }

    const transporter = createTransporter();

    // Send one email; all subscribers go in BCC so each gets individual delivery
    const info = await transporter.sendMail({
      from: `"RushPrint" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,   // sender's inbox receives a copy
      bcc: recipients,
      subject,
      html,
    });

    res.json({
      success: true,
      message: `Email sent to ${recipients.length} recipient(s).`,
      messageId: info.messageId,
      recipients: recipients.length,
    });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/test-smtp  (protected) – quick SMTP check
router.get("/test-smtp", verifyToken, async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    res.json({ success: true, message: "SMTP connection verified." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
