import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { sendOtpEmail } from "../utils/email.js";
import generateToken from "../utils/generateToken.js";

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const registerUser = async(req,res)=>{
    try{
        const { name, phone, password, organization } = req.body;
        const email = req.body.email?.trim().toLowerCase();
        if (!name || !email || !phone || !password || !organization) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        const strongPassword =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!strongPassword.test(password)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
            });
        }

        const emailDomain = email.split("@")[1]?.toLowerCase();
        const organizationData = await Organization.findById(organization);

        if (!organizationData) {
            return res.status(404).json({
                success: false,
                message: "Organization not found",
            });
        }

        const isAllowedDomain = organizationData.allowedDomains
            .map((domain) => domain.toLowerCase())
            .includes(emailDomain);

        if (!isAllowedDomain) {
            return res.status(403).json({
                success: false,
                message: "Email domain is not allowed for this organization",
            });
        }
    
        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }

        const emailOtp = generateOtp();
        const emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const user = await User.create({
            name,email,phone,
            password: await bcrypt.hash(password, 10), organization,
            emailOtp,
            emailOtpExpiresAt,
        });
        await sendOtpEmail(email, emailOtp);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            user:{
                id: user._id,
                name: user.name,
                email: user.email,
                verificationStatus: user.verificationStatus,
            },
        });

    }catch(error){
        console.error("Error during registration:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });  
    }
};


export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if (
      !user.emailOtp || user.emailOtp !== String(otp) ||
      !user.emailOtpExpiresAt || user.emailOtpExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.isEmailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiresAt = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Error verifying email OTP:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    const emailOtp = generateOtp();
    const emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.emailOtp = emailOtp;
    user.emailOtpExpiresAt = emailOtpExpiresAt;

    await user.save();
    await sendOtpEmail(user.email, emailOtp);

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email",
    });
  } catch (error) {
    console.error("Error resending email OTP:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to resend OTP",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const token = generateToken(user._id.toString());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};