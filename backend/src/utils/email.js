import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"AVONEX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "AVONEX - Email Verification OTP",
      text: `Your AVONEX verification OTP is ${otp}. It expires in 10 minutes.`,
    });

    console.log("OTP email sent:", info.messageId);
  } catch (error) {
    console.error("OTP email failed:", error);
    throw error;
  }
};
