module.exports.randomPasswordTemplate = (email, randomPassword) => {
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

            body {
                font-family: 'Cairo', sans-serif;
                background-color: #f2f4f6;
                margin: 0;
                padding: 0;
                color: #333;
            }

            .container {
                max-width: 600px;
                margin: 30px auto;
                background-color: #ffffff;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }

            h2 {
                margin-top: 0;
                color: #111827;
                text-align: center;
            }

            .section {
                margin: 20px 0;
                font-size: 16px;
                color: #444;
            }

            .info-box {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                padding: 15px;
                border-radius: 8px;
                direction: ltr;
                margin-top: 10px;
                font-weight: bold;
                color: #1f2937;
            }

            .cta-button {
                display: inline-block;
                margin-top: 20px;
                background-color: #22c55e;
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
            }

            .help-section {
                margin-top: 30px;
                background-color: #f1f5f9;
                padding: 15px;
                border-radius: 8px;
                font-size: 14px;
                color: #374151;
            }

            .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #9ca3af;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>مرحباً بك،</h2>

            <div class="section">
                شكراً لاختيارك لويالتي! لقد تم إنشاء حساب جديد خاص بك يتضمن تفاصيل تسجيل الدخول التالية:
            </div>

            <div class="section">
                <strong>اسم المستخدم:</strong>
                <div class="info-box">${email}</div>

                <strong>كلمة المرور:</strong>
                <div class="info-box">${randomPassword}</div>

                <a href="#" class="cta-button">تسجيل الدخول إلى لوحة التحكم الخاصة بك</a>
            </div>

            <div class="help-section">
                <strong>هل تحتاج إلى مساعدة؟</strong><br>
                إذا كانت لديك أي أسئلة أو تحتاج إلى دعم، لا تتردد في التواصل معنا عبر البريد التالي:
                <br>
                <a href="mailto:support@loyalty.com">support@loyalty.com</a>
            </div>

            <div class="footer">
                هذه رسالة تلقائية، لا ترد عليها<br>
                جميع الحقوق محفوظة © 2025 لويالتي
            </div>
        </div>
    </body>
    </html>
    `;
};
