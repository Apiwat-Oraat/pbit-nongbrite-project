import { transporter } from "../utils/nodemailer.js";

const emailService = {

async sendResetPinEmail(to, pin) {
  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset PIN</title>
      <style>
        body {
          margin: 0;
          padding: 40px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #fafafa;
          color: #0f172a;
          line-height: 1.6;
        }

        .container {
          max-width: 600px;
          margin: auto;
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 40px 35px;
        }

        .title {
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 25px;
          text-align: center;
        }

        .instructions {
          font-size: 16px;
          color: #475569;
          margin-bottom: 35px;
          text-align: center;
        }

        .pin-box {
          border: 1px solid #e2e8f0;
          padding: 25px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 30px;
          background: #f8fafc;
        }

        .pin-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .pin-code {
          font-size: 44px;
          font-weight: 600;
          letter-spacing: 10px;
          margin: 0;
          font-family: 'Courier New', monospace;
          color: #1e293b;
        }

        .warning {
          background: #fff7ed;
          border-left: 4px solid #fb923c;
          padding: 15px 20px;
          border-radius: 6px;
          margin-bottom: 30px;
        }

        .warning p {
          margin: 0;
          color: #9a3412;
          font-size: 14px;
        }

        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 14px;
          color: #64748b;
        }

        .brand {
          font-weight: 600;
          color: #0f172a;
        }

        @media(max-width: 600px) {
          body { padding: 20px; }
          .container { padding: 30px 20px; }
          .pin-code { font-size: 34px; letter-spacing: 6px; }
        }
      </style>
    </head>

    <body>
      <div class="container">
        <h2 class="title">รีเซ็ตรหัสผ่าน</h2>

        <p class="instructions">
          คุณได้ส่งคำขอรีเซ็ตรหัสผ่าน<br>
          กรุณาใช้รหัส PIN ต่อไปนี้เพื่อดำเนินการต่อ
        </p>

        <div class="pin-box">
          <div class="pin-label">รหัส PIN ของคุณ</div>
          <h1 class="pin-code">${pin}</h1>
        </div>

        <div class="warning">
          <p>⚠️ รหัสนี้จะหมดอายุใน <strong>10 นาที</strong> หากไม่ใช่คุณ โปรดเพิกเฉยต่ออีเมลนี้</p>
        </div>

        <p class="instructions">
          หากต้องการความช่วยเหลือ กรุณาติดต่อทีมสนับสนุนของเรา
        </p>

        <div class="footer">
          ขอบคุณที่ใช้บริการ <span class="brand">Pbit-NongBrite</span><br>
          อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
        </div>
      </div>
    </body>
    </html>
  `;


  await transporter.sendMail({
    from: `"Pbit-NongBrite" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 รหัส PIN สำหรับรีเซ็ตรหัสผ่าน - Pbit-NongBrite",
    text: `รหัส PIN สำหรับรีเซ็ตรหัสผ่านของคุณคือ: ${pin}\n\nรหัสนี้จะหมดอายุใน 10 นาที\n\nหากไม่ใช่คุณที่ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้`,
    html,
  });

  console.log(`📧 ส่ง reset PIN ไปยัง ${to} แล้ว`);
}
}

export default emailService;