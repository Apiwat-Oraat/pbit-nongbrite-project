import nodemailer from "nodemailer";


// export const transporter = nodemailer.createTransport({
//   service: "gmail", 
//   auth: {
//     user: process.env.EMAIL_USER, // Gmail account
//     pass: process.env.EMAIL_PASS, // App Password
//   },
// });

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true ถ้าใช้ port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});