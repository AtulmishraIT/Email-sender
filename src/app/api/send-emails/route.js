import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import nodemailer from "nodemailer"

// Mock email sending function - replace with your actual email service
async function sendEmail(name, email) {
  // Setup transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password
    },
  })

  const mailOptions = {
  from: `"WebCraft Studio" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "Premium E-Commerce T-Shirt Website for Sale - Ready to Launch",
  html: `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Dear ${name},</p>

        <p>I hope this message finds you well.</p>

        <p>I am reaching out to offer an exciting opportunity to acquire a modern, fully functional e-commerce website built with the MERN stack (MongoDB, Express.js, React, Node.js), designed specifically for selling t-shirts and apparel.</p>

        <p>👉 <strong>Website Live Demo:</strong><br>
        <a href="https://tshirtweb-three.vercel.app/" target="_blank">https://tshirtweb-three.vercel.app/</a></p>

        <p><strong>Key Features:</strong></p>
        <ul>
          <li>Modern, responsive, and mobile-friendly design</li>
          <li>Secure user registration, login, and account management</li>
          <li>Product filtering by category (Men’s, Women’s Collections)</li>
          <li>Shopping cart, checkout, and order management</li>
          <li>Clean codebase, optimized for performance</li>
          <li>Built for scalability – easily customizable to fit any brand</li>
        </ul>

        <p><strong>Why Buy This Website?</strong></p>
        <ul>
          <li>Save months of development time</li>
          <li>Professional design and functionality</li>
          <li>Ready for deployment or further customization</li>
          <li>Ideal for entrepreneurs or businesses wanting to enter the e-commerce space</li>
        </ul>

        <p><strong>Asking Price:</strong> $500/₹44,150</p>

        <p>I’m happy to provide full code access, documentation, and deployment guidance.</p>

        <p>If you are interested or would like a demo walkthrough, please feel free to reply to this email or contact me directly at 📞 +91 7756064570.</p>

        <p>Best regards,<br>
        <strong>Atul Mishra</strong><br>
        WebCraft Studio – Web Development Specialist<br>
        📧 officialwebcraftstudio@gmail.com<br>
        🌐 <a href="https://webcraft-atulmishra.vercel.app/" target="_blank">Portfolio</a></p>
      </body>
    </html>
  `,
}


  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(` Email sent successfully to ${name} (${email}): ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(` Failed to send email to ${name} (${email}):`, error)
    return { success: false, error: error.message }
  }
}

function parseExcelData(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

  const contacts = []

  // Skip header row and process data
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (row && row.length >= 2) {
      const name = String(row[0] || "").trim()
      const email = String(row[1] || "").trim()

      if (name && email && email.includes("@")) {
        contacts.push({ name, email })
      }
    }
  }

  return contacts
}

function parsePastedData(pastedData) {
  const lines = pastedData.split("\n").filter((line) => line.trim())
  const contacts = []

  for (const line of lines) {
    // Try tab-separated first, then comma-separated
    let parts = line.split("\t")
    if (parts.length < 2) {
      parts = line.split(",")
    }

    if (parts.length >= 2) {
      const name = parts[0].trim()
      const email = parts[1].trim()

      if (name && email && email.includes("@")) {
        contacts.push({ name, email })
      }
    }
  }

  return contacts
}

export async function POST(request) {
  try {
    let contacts = []

    const contentType = request.headers.get("content-type")

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get("file")

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      contacts = parseExcelData(buffer)
    } else {
      // Handle pasted data
      const { pastedData } = await request.json()

      if (!pastedData) {
        return NextResponse.json({ error: "No data provided" }, { status: 400 })
      }

      contacts = parsePastedData(pastedData)
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: "No valid contacts found" }, { status: 400 })
    }

    console.log(` Processing ${contacts.length} contacts for email sending`)

    // Send emails to all contacts
    const results = []
    for (const contact of contacts) {
      const result = await sendEmail(contact.name, contact.email)
      results.push({
        name: contact.name,
        email: contact.email,
        status: result.success ? "success" : "failed",
        error: result.error,
        messageId: result.messageId,
      })

      // Add 1 second delay between emails to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    const successCount = results.filter((r) => r.status === "success").length
    console.log(` Email sending completed: ${successCount}/${results.length} successful`)

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount,
      },
    })
  } catch (error) {
    console.error(" Error processing email request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
