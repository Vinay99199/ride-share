import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Organization from "../models/Organization.js";

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const registerUser = async(req,res)=>{
    try{
        const {name,email,phone,password,organization} = req.body;

        if (!name || !email || !phone || !password || !organization) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
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