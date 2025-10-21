const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_LEARNMATE_USERNAME,
    pass: process.env.MAIL_LEARNMATE_PASSWORD,
  },
});

function sendMail(to, subject, htmlContent) {
  const mailOptions = {
    from: process.env.MAIL_LEARNMATE_USERNAME,
    to,
    subject,
    html: htmlContent,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendMail };
