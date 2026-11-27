import bcrypt from "bcryptjs";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import DriverApplication from "../models/DriverApplication.js";
import { sendOtpEmail } from "../utils/email.js";
import generateToken from "../utils/generateToken.js";
import { disconnectUserSockets } from "../realtime/tracking.socket.js";
import notificationService from "../services/notification.service.js";
import {
  getOrganizationDomainVerificationStatus,
  isOrganizationEmailDomainVerified,
  isPersonalEmailDomain,
  normalizeEmailDomain,
} from "../utils/organizationDomain.js";

const generateOtp = () => {
  return String(randomInt(100000, 1000000));
};

const strongPassword =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const allowedProfileFields = new Set([
  "name",
  "phone",
  "homeLocation",
  "homeLocationName",
  "homeAddress",
]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  organization: user.organization,
  homeLocation: user.homeLocation,
  homeLocationName: user.homeLocationName || "",
  homeAddress: user.homeAddress || "",
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  verificationStatus: user.verificationStatus,
  rating: user.rating,
  ratingCount: user.ratingCount,
  isActive: user.isActive !== false,
});

export const createEmailChangeOtpHash = (
  userId,
  email,
  otp,
  secret = process.env.JWT_SECRET
) =>
  createHmac("sha256", secret)
    .update(`${userId}:${email}:${otp}`)
    .digest("hex");

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const isValidHomeLocation = (location) =>
  location === null ||
  (location &&
    typeof location === "object" &&
    !Array.isArray(location) &&
    location.type === "Point" &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2 &&
    Number.isFinite(location.coordinates[0]) &&
    Number.isFinite(location.coordinates[1]) &&
    location.coordinates[0] >= -180 &&
    location.coordinates[0] <= 180 &&
    location.coordinates[1] >= -90 &&
    location.coordinates[1] <= 90);

export const createRegisterUserController = ({
  UserModel = User,
  OrganizationModel = Organization,
  DriverApplicationModel = DriverApplication,
  bcryptLibrary = bcrypt,
  emailSender = sendOtpEmail,
  otpGenerator = generateOtp,
  now = () => new Date(),
  mongooseInstance = mongoose,
} = {}) => async (req, res) => {
  try {
    const body = req.body;
    const allowedFields = new Set([
      "role",
      "name",
      "email",
      "phone",
      "password",
      "organization",
      "identityVerification",
      "licenseNumber",
      "vehicleNumber",
      "vehicleType",
      "organizationName",
      "organizationType",
      "address",
      "website",
      "registrationNumber",
    ]);
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some((field) => !allowedFields.has(field))
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid registration object is required",
      });
    }

    const legacyRegistration = body.role === undefined;
    const role = legacyRegistration ? "passenger" : body.role;
    if (!["passenger", "driver", "organization"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Public registration role must be passenger, driver, or organization",
      });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = normalizeEmail(body.email);
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const { password, organization } = body;
    if (!name || name.length > 120 || !email || email.length > 254 ||
      !emailPattern.test(email) || phone.length < 3 || phone.length > 30 ||
      !/^[+0-9().\-\s]+$/.test(phone) ||
      typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Enter valid name, email, phone, and password values",
      });
    }

    let identityVerification;
    if (role === "passenger" || role === "driver") {
      if (
        typeof organization !== "string" ||
        !mongooseInstance.isValidObjectId(organization)
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid organization is required",
        });
      }
      const details = body.identityVerification;
      if (!legacyRegistration && (
        !details ||
        typeof details !== "object" ||
        Array.isArray(details) ||
        Object.keys(details).some(
          (field) => !["legalName", "documentType", "documentLast4"].includes(field)
        )
      )) {
        return res.status(400).json({
          success: false,
          message: "Identity verification details are required",
        });
      }
      if (details) {
        const legalName =
          typeof details.legalName === "string" ? details.legalName.trim() : "";
        const documentLast4 =
          typeof details.documentLast4 === "string"
            ? details.documentLast4.trim()
            : "";
        if (
          legalName.length < 2 ||
          legalName.length > 120 ||
          !["passport", "national_id", "driver_license"].includes(details.documentType) ||
          !/^[A-Za-z0-9]{4}$/.test(documentLast4)
        ) {
          return res.status(400).json({
            success: false,
            message: "Enter valid identity verification details",
          });
        }
        identityVerification = {
          legalName,
          documentType: details.documentType,
          documentLast4,
          submittedAt: now(),
        };
      }
    }

    let driverDetails;
    if (role === "driver") {
      const licenseNumber =
        typeof body.licenseNumber === "string" ? body.licenseNumber.trim() : "";
      const vehicleNumber =
        typeof body.vehicleNumber === "string" ? body.vehicleNumber.trim() : "";
      if (
        licenseNumber.length < 2 ||
        licenseNumber.length > 120 ||
        vehicleNumber.length < 2 ||
        vehicleNumber.length > 30 ||
        !["car", "bike"].includes(body.vehicleType)
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid driving licence and vehicle details are required",
        });
      }
      driverDetails = { licenseNumber, vehicleNumber, vehicleType: body.vehicleType };
    }

    if (!strongPassword.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    let organizationData;
    if (role === "organization") {
      const organizationName =
        typeof body.organizationName === "string" ? body.organizationName.trim() : "";
      const address = typeof body.address === "string" ? body.address.trim() : "";
      const registrationNumber =
        typeof body.registrationNumber === "string"
          ? body.registrationNumber.trim()
          : "";
      const website = typeof body.website === "string" ? body.website.trim() : "";
      if (
        organizationName.length < 2 ||
        organizationName.length > 120 ||
        ![
          "college",
          "university",
          "institute",
          "company",
          "institution",
          "other",
        ].includes(body.organizationType) ||
        address.length < 5 ||
        address.length > 500 ||
        registrationNumber.length < 2 ||
        registrationNumber.length > 120 ||
        website.length > 2048
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid organization name, type, address, and verification details are required",
        });
      }
      if (
        website &&
        !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(website)
      ) {
        return res.status(400).json({
          success: false,
          message: "Website must be a valid HTTP or HTTPS URL",
        });
      }
      organizationData = {
        name: organizationName,
        type: body.organizationType,
        allowedDomains: [],
        verifiedDomains: [],
        domainVerificationStatus: "pending",
        approvalStatus: "pending",
        officialEmail: email,
        contactPerson: name,
        contactPhone: phone,
        address,
        website: website || undefined,
        registrationNumber,
        isActive: true,
      };
    } else if (role === "passenger" || role === "driver") {
      if (
        typeof organization !== "string" ||
        !mongooseInstance.isValidObjectId(organization)
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid organization is required",
        });
      }
      const emailDomain = normalizeEmailDomain(email.split("@")[1]);
      const selectedOrganization = await OrganizationModel.findById(organization);
      if (!selectedOrganization) {
        return res.status(404).json({
          success: false,
          message: "Organization not found",
        });
      }
      if (
        selectedOrganization.isActive === false ||
        (selectedOrganization.approvalStatus &&
          selectedOrganization.approvalStatus !== "approved")
      ) {
        return res.status(403).json({
          success: false,
          message: "This organization is not accepting new registrations",
        });
      }
      if (isPersonalEmailDomain(emailDomain)) {
        return res.status(403).json({
          success: false,
          message:
            "Personal email domains cannot be used for institutional registration",
        });
      }
      if (!isOrganizationEmailDomainVerified(selectedOrganization, emailDomain)) {
        return res.status(403).json({
          success: false,
          message:
            getOrganizationDomainVerificationStatus(
              selectedOrganization
            ) === "pending"
              ? "This organization's email domain is pending verification. Registration is unavailable until an administrator verifies its official domain."
              : "This email domain has not been verified for the selected organization.",
        });
      }
      organizationData = { _id: selectedOrganization._id || organization };
    }

    if (await UserModel.findOne({ email })) {
      return res.status(409).json({
        success: false,
        message: "An account already uses this email address",
      });
    }

    const emailOtp = otpGenerator();
    const emailOtpExpiresAt = new Date(now().getTime() + 10 * 60 * 1000);
    if (role === "organization") {
      organizationData = await OrganizationModel.create(organizationData);
    }

    let user;
    try {
      user = await UserModel.create({
      name,
      email,
      phone,
      password: await bcryptLibrary.hash(password, 10),
      organization: organizationData._id,
      role,
      ...(identityVerification
        ? { identityVerification, verificationStatus: "pending" }
        : {}),
      emailOtp,
      emailOtpExpiresAt,
      });
      if (driverDetails) {
        await DriverApplicationModel.create({
          user: user._id,
          ...driverDetails,
          status: "pending",
        });
      }
    } catch (error) {
      if (user && DriverApplicationModel.deleteMany) {
        await DriverApplicationModel.deleteMany({ user: user._id });
      }
      if (user && UserModel.deleteOne) {
        await UserModel.deleteOne({ _id: user._id });
      }
      if (role === "organization" && organizationData?._id && OrganizationModel.deleteOne) {
        await OrganizationModel.deleteOne({ _id: organizationData._id });
      }
      throw error;
    }
    await emailSender(email, emailOtp);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account already uses this email address",
      });
    }
    console.error(
      "Error during registration:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const registerUser = createRegisterUserController();

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
    console.error(
      "Error verifying email OTP:",
      error instanceof Error ? error.name : "UnknownError"
    );

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
    console.error(
      "Error resending email OTP:",
      error instanceof Error ? error.name : "UnknownError"
    );

    return res.status(500).json({
      success: false,
      message: "Unable to resend OTP",
    });
  }
};

export const createLoginUserController = ({
  UserModel = User,
  bcryptLibrary = bcrypt,
  tokenGenerator = generateToken,
} = {}) => async (req, res) => {
  try {
    const body = req.body;
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some((field) => !["email", "password"].includes(field))
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid email and password are required",
      });
    }

    const email = normalizeEmail(body.email);
    const { password } = body;
    if (
      !email ||
      email.length > 254 ||
      !emailPattern.test(email) ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid email and password are required",
      });
    }

    const user = await UserModel.findOne({ email }).select("+authVersion");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcryptLibrary.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact your organization administrator.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const token = tokenGenerator(user._id.toString(), user.authVersion ?? 0);
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
    console.error(
      "Error during login:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const loginUser = createLoginUserController();

export const updateProfile = async (req, res, { UserModel = User } = {}) => {
  try {
    const body = req.body;
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !Object.keys(body).length ||
      Object.keys(body).some((field) => !allowedProfileFields.has(field))
    ) {
      return res.status(400).json({
        success: false,
        message: "Only name, phone, and home location fields may be updated",
      });
    }

    const updates = {};
    if (Object.hasOwn(body, "name")) {
      if (typeof body.name !== "string" || body.name.trim().length < 1 || body.name.trim().length > 120) {
        return res.status(400).json({
          success: false,
          message: "name must be between 1 and 120 characters",
        });
      }
      updates.name = body.name.trim();
    }
    if (Object.hasOwn(body, "phone")) {
      if (
        typeof body.phone !== "string" ||
        body.phone.trim().length < 3 ||
        body.phone.trim().length > 30 ||
        !/^[+0-9().\-\s]+$/.test(body.phone.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "phone must be a valid phone number between 3 and 30 characters",
        });
      }
      updates.phone = body.phone.trim();
    }
    if (Object.hasOwn(body, "homeLocation")) {
      if (!isValidHomeLocation(body.homeLocation)) {
        return res.status(400).json({
          success: false,
          message: "homeLocation must be null or a valid GeoJSON Point",
        });
      }
      updates.homeLocation = body.homeLocation;
      if (body.homeLocation === null) {
        updates.homeLocationName = "";
        updates.homeAddress = "";
      }
    }
    for (const [field, maxLength] of [
      ["homeLocationName", 200],
      ["homeAddress", 500],
    ]) {
      if (!Object.hasOwn(body, field)) continue;
      if (typeof body[field] !== "string" || body[field].trim().length > maxLength) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string of at most ${maxLength} characters`,
        });
      }
      updates[field] = body[field].trim();
    }

    const user = await UserModel.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -emailOtp -emailOtpExpiresAt");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

const versionFilter = (authVersion) =>
  authVersion === 0
    ? { $or: [{ authVersion: 0 }, { authVersion: { $exists: false } }] }
    : { authVersion };

export const changePassword = async (
  req,
  res,
  {
    UserModel = User,
    bcryptLibrary = bcrypt,
    tokenGenerator = generateToken,
    notifications = notificationService,
    disconnectSockets = disconnectUserSockets,
  } = {}
) => {
  try {
    const body = req.body;
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 2 ||
      !Object.hasOwn(body, "currentPassword") ||
      !Object.hasOwn(body, "newPassword")
    ) {
      return res.status(400).json({
        success: false,
        message: "Only currentPassword and newPassword are accepted",
      });
    }
    if (typeof body.currentPassword !== "string" || !body.currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
      });
    }
    if (typeof body.newPassword !== "string" || !strongPassword.test(body.newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    const user = await UserModel.findById(req.user._id).select("+password +authVersion");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!(await bcryptLibrary.compare(body.currentPassword, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }
    if (await bcryptLibrary.compare(body.newPassword, user.password)) {
      return res.status(400).json({
        success: false,
        message: "New password must differ from the current password",
      });
    }

    const previousVersion = user.authVersion ?? 0;
    const newVersion = previousVersion + 1;
    const updatedUser = await UserModel.findOneAndUpdate(
      {
        _id: user._id,
        password: user.password,
        ...versionFilter(previousVersion),
      },
      {
        $set: {
          password: await bcryptLibrary.hash(body.newPassword, 10),
          authVersion: newVersion,
        },
        $unset: {
          pendingEmail: 1,
          pendingEmailOtpHash: 1,
          pendingEmailOtpExpiresAt: 1,
        },
      },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(409).json({
        success: false,
        message: "Account credentials changed; sign in and try again",
      });
    }

    const token = tokenGenerator(user._id.toString(), newVersion);
    await notifications.notifyAfterCommit([
      {
        recipient: user._id,
        type: "account_security",
        title: "Password changed",
        message:
          "Your account password was changed. If you did not make this change, contact your organization administrator.",
        eventKey: `account-security:${user._id}:password:${newVersion}`,
      },
    ]);
    await disconnectSockets(user._id);
    return res.status(200).json({
      success: true,
      message: "Password changed. Other active sessions have been signed out.",
      token,
      user: serializeUser(updatedUser),
    });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
};

export const requestEmailChange = async (
  req,
  res,
  {
    UserModel = User,
    OrganizationModel = Organization,
    emailSender = sendOtpEmail,
    secret = process.env.JWT_SECRET,
  } = {}
) => {
  try {
    const body = req.body;
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !Object.hasOwn(body, "email")
    ) {
      return res.status(400).json({
        success: false,
        message: "Only the new email address is accepted",
      });
    }

    const email = normalizeEmail(body.email);
    if (email.length > 254 || !emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required",
      });
    }
    if (email === req.user.email) {
      return res.status(400).json({
        success: false,
        message: "The new email must differ from your current email",
      });
    }

    const organization = await OrganizationModel.findById(req.user.organization)
      .select(
        "name allowedDomains verifiedDomains isActive domainVerificationStatus"
      )
      .lean();
    if (!organization) {
      return res.status(409).json({
        success: false,
        message: "Your organization could not be verified",
      });
    }
    if (organization.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your organization is not accepting account changes",
      });
    }

    const domain = normalizeEmailDomain(email.split("@")[1]);
    if (isPersonalEmailDomain(domain)) {
      return res.status(403).json({
        success: false,
        message:
          "Personal email domains cannot be used for institutional account changes",
      });
    }
    if (!isOrganizationEmailDomainVerified(organization, domain)) {
      return res.status(403).json({
        success: false,
        message:
          "Your email domain is not verified for this organization",
      });
    }
    if (await UserModel.exists({ email })) {
      return res.status(409).json({
        success: false,
        message: "An account already uses this email address",
      });
    }

    const otp = generateOtp();
    const user = await UserModel.findById(req.user._id).select(
      "-password -emailOtp -emailOtpExpiresAt +pendingEmail +pendingEmailOtpHash +pendingEmailOtpExpiresAt"
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.pendingEmail = email;
    user.pendingEmailOtpHash = createEmailChangeOtpHash(
      user._id,
      email,
      otp,
      secret
    );
    user.pendingEmailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await emailSender(email, otp);

    return res.status(200).json({
      success: true,
      message: "A verification code was sent to the new email address",
      pendingEmail: email,
      expiresInSeconds: 600,
    });
  } catch (error) {
    console.error("Request email change error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to request email change",
    });
  }
};

export const getEmailChangeRequest = async (
  req,
  res,
  { UserModel = User } = {}
) => {
  try {
    const user = await UserModel.findById(req.user._id).select(
      "-password -emailOtp -emailOtpExpiresAt +pendingEmail +pendingEmailOtpExpiresAt"
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isPending =
      user.pendingEmail &&
      user.pendingEmailOtpExpiresAt &&
      user.pendingEmailOtpExpiresAt.getTime() > Date.now();
    return res.status(200).json({
      success: true,
      pendingEmail: isPending ? user.pendingEmail : null,
      expiresAt: isPending ? user.pendingEmailOtpExpiresAt : null,
    });
  } catch (error) {
    console.error("Fetch email change request error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch email change status",
    });
  }
};

export const confirmEmailChange = async (
  req,
  res,
  {
    UserModel = User,
    tokenGenerator = generateToken,
    notifications = notificationService,
    disconnectSockets = disconnectUserSockets,
    secret = process.env.JWT_SECRET,
  } = {}
) => {
  try {
    const body = req.body;
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      typeof body.otp !== "string" ||
      !/^\d{6}$/.test(body.otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "A six-digit OTP is required",
      });
    }

    const user = await UserModel.findById(req.user._id).select(
      "-password -emailOtp -emailOtpExpiresAt +authVersion +pendingEmail +pendingEmailOtpHash +pendingEmailOtpExpiresAt"
    );
    if (
      !user?.pendingEmail ||
      !user.pendingEmailOtpHash ||
      !user.pendingEmailOtpExpiresAt ||
      user.pendingEmailOtpExpiresAt.getTime() <= Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "No unexpired email change request was found",
      });
    }

    const expectedHash = Buffer.from(user.pendingEmailOtpHash, "hex");
    const providedHash = Buffer.from(
      createEmailChangeOtpHash(
        user._id,
        user.pendingEmail,
        body.otp,
        secret
      ),
      "hex"
    );
    if (
      expectedHash.length !== providedHash.length ||
      !timingSafeEqual(expectedHash, providedHash)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired email verification code",
      });
    }

    const previousVersion = user.authVersion ?? 0;
    const newVersion = previousVersion + 1;
    const updatedUser = await UserModel.findOneAndUpdate(
      {
        _id: user._id,
        pendingEmail: user.pendingEmail,
        pendingEmailOtpHash: user.pendingEmailOtpHash,
        pendingEmailOtpExpiresAt: { $gt: new Date() },
        ...versionFilter(previousVersion),
      },
      {
        $set: {
          email: user.pendingEmail,
          isEmailVerified: true,
          authVersion: newVersion,
        },
        $unset: {
          pendingEmail: 1,
          pendingEmailOtpHash: 1,
          pendingEmailOtpExpiresAt: 1,
          emailOtp: 1,
          emailOtpExpiresAt: 1,
        },
      },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(409).json({
        success: false,
        message: "Email change request is no longer valid",
      });
    }

    const token = tokenGenerator(user._id.toString(), newVersion);
    await notifications.notifyAfterCommit([
      {
        recipient: user._id,
        type: "account_security",
        title: "Email address changed",
        message:
          "Your account email address was changed and verified. If you did not make this change, contact your organization administrator.",
        eventKey: `account-security:${user._id}:email:${newVersion}`,
      },
    ]);
    await disconnectSockets(user._id);
    return res.status(200).json({
      success: true,
      message: "Email changed and verified successfully",
      token,
      user: serializeUser(updatedUser),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account already uses this email address",
      });
    }
    console.error("Confirm email change error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to confirm email change",
    });
  }
};
