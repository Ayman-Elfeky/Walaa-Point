const nodemailer = require('nodemailer');

module.exports.sendEmail = async (userEmail, subject, htmlTemplate) => {
    console.log("Receive user email successfully: ", userEmail);
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.APP_EMAIL_ADDRESS,
                pass: process.env.APP_EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: `"Walaa Point" <${process.env.APP_EMAIL_ADDRESS}>`,
            to: userEmail,
            subject: subject,
            html: htmlTemplate
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: ", info.response);
    } catch (error) {
        console.log("Error: ", error.message);
        throw new Error("Internal Server Error: nodemailer\n", error.message)
    }
}