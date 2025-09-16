import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import nodemailer from "nodemailer";

// Mock email sending function - replace with your actual email service
async function sendEmail(name, email) {
  // Setup transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password
    },
  });

  const mailOptions = {
    from: `"WebCraft Studio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Grow Your Business with a Custom Website",
    html: `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
<p>Dear ${name},</p>
<p>I'm <strong>Atul Mishra</strong> from <strong>WebCraft Studio</strong>. We build custom, modern websites to help businesses stand out online.</p>
<p>See our portfolio: 
<a href="https://officialwebcraftstudio.vercel.app/" target="_blank">WebCraft Studio</a></p>
<p>Let's schedule a free consultation this week.</p>
<p>Best regards,<br>Atul Mishra<br>📞 +91 7756064570</p>
 </body>
 </html>
 `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      ` Email sent successfully to ${name} (${email}): ${info.messageId}`
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(` Failed to send email to ${name} (${email}):`, error);
    return { success: false, error: error.message };
  }
}

function parseExcelData(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const contacts = []; // Skip header row and process data

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length >= 2) {
      const name = String(row[0] || "").trim();
      const email = String(row[1] || "").trim();

      if (name && email && email.includes("@")) {
        contacts.push({ name, email });
      }
    }
  }

  return contacts;
}

function parsePastedData(pastedData) {
  const lines = pastedData.split("\n").filter((line) => line.trim());
  const contacts = [];

  for (const line of lines) {
    // Try tab-separated first, then comma-separated
    let parts = line.split("\t");
    if (parts.length < 2) {
      parts = line.split(",");
    }

    if (parts.length >= 2) {
      const name = parts[0].trim();
      const email = parts[1].trim();

      if (name && email && email.includes("@")) {
        contacts.push({ name, email });
      }
    }
  }

  return contacts;
}

export async function POST(request) {
  try {
    let contacts = [];

    const contentType = request.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      contacts = parseExcelData(buffer);
    } else {
      // Handle pasted data
      const { pastedData } = await request.json();

      if (!pastedData) {
        return NextResponse.json(
          { error: "No data provided" },
          { status: 400 }
        );
      }

      contacts = parsePastedData(pastedData);
    }

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "No valid contacts found" },
        { status: 400 }
      );
    }

    console.log(` Processing ${contacts.length} contacts for email sending`); // Send emails to all contacts

    const results = [];
    for (const contact of contacts) {
      const result = await sendEmail(contact.name, contact.email);
      results.push({
        name: contact.name,
        email: contact.email,
        status: result.success ? "success" : "failed",
        error: result.error,
        messageId: result.messageId,
      }); // Add 1 second delay between emails to avoid rate limiting

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const successCount = results.filter((r) => r.status === "success").length;
    console.log(
      ` Email sending completed: ${successCount}/${results.length} successful`
    );

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount,
      },
    });
  } catch (error) {
    console.error(" Error processing email request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
