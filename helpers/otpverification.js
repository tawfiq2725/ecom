const nodemailer = require('nodemailer');

// Generate OTP
const GenerateOtp = () => {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    console.log("Generated OTP:", otp);
    return otp;  
}

const sendMail = async (email, otp) => {
    try {
        // Send OTP via email
        const transporter = nodemailer.createTransport({
            host: process.env.BREVO_SERVER,
            port: process.env.BREVO_PORT,
            secure: false,
            auth: {
                user: process.env.BREVO_MAIL,
                pass: process.env.BREVO_KEY
            }
        });

        await transporter.verify();

        const emailDetails = await transporter.sendMail({
            from: process.env.BREVO_MAIL,
            to: email,
            subject: "Verify Your OTP",
            html: `
            <h1>Hossom Shirts </h1>
            <br>
            <p>Your OTP is ${otp}. It will expire in 5 minutes.</p>`
        });

        return emailDetails;
    } catch (error) {
        console.error('Error sending email:', error);
        return null;
    }
}

module.exports = {
    GenerateOtp,
    sendMail
}