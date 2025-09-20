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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 30px 20px;
        }
        .header h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .pin-container {
          background: #f8fafc;
          border: 2px dashed #e2e8f0;
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
        }
        .pin-label {
          color: #64748b;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .pin-code {
          font-size: 48px;
          font-weight: bold;
          color: #1e293b;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
          margin: 0;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .warning {
          background: #fef3cd;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .warning-icon {
          color: #f59e0b;
          font-size: 18px;
          margin-right: 8px;
        }
        .warning-text {
          color: #92400e;
          font-size: 14px;
          margin: 0;
          display: inline;
        }
        .instructions {
          color: #475569;
          font-size: 16px;
          margin: 20px 0;
        }
        .footer {
          background: #f8fafc;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }
        .brand {
          color: #667eea;
          font-weight: 600;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .content {
            padding: 25px 20px;
          }
          .pin-code {
            font-size: 36px;
            letter-spacing: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔐 รีเซ็ตรหัสผ่าน</h2>
        </div>
        
        <div class="content">
          <p class="instructions">
            สวัสดีครับ/ค่ะ<br>
            คุณได้ร้องขอให้รีเซ็ตรหัสผ่าน กรุณาใช้ PIN ด้านล่างเพื่อดำเนินการต่อ
          </p>
          
          <div class="pin-container">
            <div class="pin-label">รหัส PIN ของคุณ:</div>
            <h1 class="pin-code">${pin}</h1>
          </div>
          
          <div class="warning">
            <span class="warning-icon">⚠️</span>
            <p class="warning-text">
              <strong>หมายเหตุ:</strong> รหัส PIN นี้จะหมดอายุใน <strong>10 นาที</strong> 
              หากไม่ใช่คุณที่ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้
            </p>
          </div>
          
          <p class="instructions">
            หากคุณมีปัญหาหรือข้อสงสัย กรุณาติดต่อทีมสนับสนุนของเรา
          </p>
        </div>
        
        <div class="footer">
          <p>
            ขอบคุณที่ใช้บริการ <span class="brand">Pbit-NongBrite</span><br>
            อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
          </p>
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