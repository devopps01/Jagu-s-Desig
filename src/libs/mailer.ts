import nodemailer from 'nodemailer'

export const sendOtpEmail = async (email: string, otp: string) => {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.info(`[web-otp] SMTP not configured. OTP for ${email}: ${otp}`)

    return { sent: false }
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user, pass }
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to: email,
    subject: 'Your Vastranand login OTP',
    text: `Your login OTP is ${otp}. It is valid for 1 minute.`,
    html: `<p>Your login OTP is <strong>${otp}</strong>.</p><p>It is valid for 1 minute.</p>`
  })

  return { sent: true }
}

export const sendContactNotify = async (input: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}) => {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const to = process.env.CONTACT_NOTIFY_EMAIL || user

  if (!host || !user || !pass || !to) {
    console.info(`[contact] ${input.name} <${input.email}> · ${input.subject}`)

    return { sent: false }
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user, pass }
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to,
    replyTo: input.email,
    subject: `Contact: ${input.subject} — ${input.name}`,
    text: [`Name: ${input.name}`, `Email: ${input.email}`, input.phone ? `Phone: ${input.phone}` : '', '', input.message]
      .filter(Boolean)
      .join('\n'),
    html: `<p><strong>${input.name}</strong> wrote about <strong>${input.subject}</strong>.</p>
<p>Email: ${input.email}${input.phone ? `<br/>Phone: ${input.phone}` : ''}</p>
<p>${input.message.replace(/\n/g, '<br/>')}</p>`
  })

  return { sent: true }
}
