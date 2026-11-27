const sections = (common, auth, settings) => ({
  common,
  auth,
  settings,
  passenger: {},
  driver: {},
  organization: {},
  admin: {},
  forms: {},
  errors: {},
  notifications: {},
});

const en = sections(
  {
    language: "Language",
    selectLanguage: "Choose a language",
    languages: "Languages",
    currentLanguage: "Current language",
    savePreference: "Your choice is saved on this device.",
    coverageNotice: "Common navigation, sign-in, and language settings are translated. Many route-specific screens and messages still use English; untranslated text falls back to English.",
    themePreference: "Theme preference",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    nav: {
      passengerDashboard: "Passenger dashboard",
      driverDashboard: "Driver dashboard",
      findRides: "Find rides",
      bookings: "Bookings",
      rideHistory: "Ride history",
      createRide: "Create ride",
      bookingRequests: "Booking requests",
      liveTracking: "Live tracking",
      ratings: "Ratings & reviews",
      applicationStatus: "Application status",
      adminDashboard: "Admin dashboard",
      reviewCenter: "Review center",
      userManagement: "User management",
      organizations: "Organizations",
      rideMonitoring: "Ride monitoring",
      reports: "Reports & reviews",
      auditLog: "Audit log",
      notifications: "Notifications",
      settings: "Settings",
      help: "Help & support",
      profile: "Profile",
      signOut: "Sign out",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
    },
  },
  {
    welcomeBack: "Welcome back",
    signIn: "Sign in",
    signingIn: "Signing in…",
    email: "Email address",
    password: "Password",
    createAccount: "Create an account",
    newToCommunity: "New to the community?",
    verifyEmail: "Verify your email",
  },
  {
    preferences: "Preferences",
    account: "Account",
    allSettings: "All settings",
    languageDescription: "Choose your interface language. Your choice is saved for future visits.",
    availableLanguages: "Available languages",
    theme: "Appearance",
    settingsTitle: "Settings",
    settingsDescription: "Manage your account preferences.",
  }
);

const hi = sections(
  {
    language: "भाषा",
    selectLanguage: "भाषा चुनें",
    languages: "भाषाएँ",
    currentLanguage: "वर्तमान भाषा",
    savePreference: "आपकी पसंद इस डिवाइस पर सहेजी जाती है।",
    coverageNotice: "मुख्य नेविगेशन, साइन-इन और भाषा सेटिंग का अनुवाद किया गया है। कई अन्य स्क्रीन और संदेश अभी अंग्रेज़ी में हैं; जिनका अनुवाद नहीं है वे अंग्रेज़ी में दिखेंगे।",
    themePreference: "थीम प्राथमिकता",
    themeLight: "लाइट",
    themeDark: "डार्क",
    themeSystem: "सिस्टम",
    nav: {
      passengerDashboard: "यात्री डैशबोर्ड", driverDashboard: "ड्राइवर डैशबोर्ड",
      findRides: "राइड खोजें", bookings: "बुकिंग", rideHistory: "राइड इतिहास",
      createRide: "राइड बनाएँ", bookingRequests: "बुकिंग अनुरोध", liveTracking: "लाइव ट्रैकिंग",
      ratings: "रेटिंग और समीक्षाएँ", applicationStatus: "आवेदन की स्थिति",
      adminDashboard: "एडमिन डैशबोर्ड", reviewCenter: "समीक्षा केंद्र",
      userManagement: "उपयोगकर्ता प्रबंधन", organizations: "संस्थान",
      rideMonitoring: "राइड निगरानी", reports: "रिपोर्ट और समीक्षाएँ", auditLog: "ऑडिट लॉग",
      notifications: "सूचनाएँ", settings: "सेटिंग", help: "सहायता", profile: "प्रोफ़ाइल",
      signOut: "साइन आउट", openMenu: "नेविगेशन मेनू खोलें", closeMenu: "नेविगेशन मेनू बंद करें",
    },
  },
  {
    welcomeBack: "वापसी पर स्वागत है", signIn: "साइन इन करें", signingIn: "साइन इन हो रहा है…",
    email: "ईमेल पता", password: "पासवर्ड", createAccount: "खाता बनाएँ",
    newToCommunity: "समुदाय में नए हैं?", verifyEmail: "ईमेल सत्यापित करें",
  },
  {
    preferences: "प्राथमिकताएँ", allSettings: "सभी सेटिंग", languageDescription: "अपनी इंटरफ़ेस भाषा चुनें। आपकी पसंद अगली बार के लिए सहेजी जाएगी।",
    account: "खाता",
    availableLanguages: "उपलब्ध भाषाएँ", theme: "दिखावट", settingsTitle: "सेटिंग", settingsDescription: "अपने खाते की प्राथमिकताएँ प्रबंधित करें।",
  }
);

const bn = sections(
  {
    language: "ভাষা", selectLanguage: "ভাষা বেছে নিন", languages: "ভাষাসমূহ",
    currentLanguage: "বর্তমান ভাষা", savePreference: "আপনার পছন্দ এই ডিভাইসে সংরক্ষিত হবে।",
    coverageNotice: "সাধারণ নেভিগেশন, সাইন-ইন ও ভাষার সেটিং অনুবাদ করা হয়েছে। অনেক পর্দা ও বার্তা এখনও ইংরেজিতে আছে; অনূদিত নয় এমন লেখা ইংরেজিতেই দেখানো হবে।",
    themePreference: "থিমের পছন্দ",
    themeLight: "হালকা",
    themeDark: "গাঢ়",
    themeSystem: "সিস্টেম",
    nav: {
      passengerDashboard: "যাত্রী ড্যাশবোর্ড", driverDashboard: "চালক ড্যাশবোর্ড",
      findRides: "রাইড খুঁজুন", bookings: "বুকিং", rideHistory: "রাইডের ইতিহাস",
      createRide: "রাইড তৈরি করুন", bookingRequests: "বুকিং অনুরোধ", liveTracking: "লাইভ ট্র্যাকিং",
      ratings: "রেটিং ও পর্যালোচনা", applicationStatus: "আবেদনের অবস্থা",
      adminDashboard: "অ্যাডমিন ড্যাশবোর্ড", reviewCenter: "পর্যালোচনা কেন্দ্র",
      userManagement: "ব্যবহারকারী পরিচালনা", organizations: "প্রতিষ্ঠান",
      rideMonitoring: "রাইড পর্যবেক্ষণ", reports: "রিপোর্ট ও পর্যালোচনা", auditLog: "অডিট লগ",
      notifications: "বিজ্ঞপ্তি", settings: "সেটিংস", help: "সহায়তা", profile: "প্রোফাইল",
      signOut: "সাইন আউট", openMenu: "নেভিগেশন মেনু খুলুন", closeMenu: "নেভিগেশন মেনু বন্ধ করুন",
    },
  },
  {
    welcomeBack: "ফিরে আসার জন্য স্বাগতম", signIn: "সাইন ইন", signingIn: "সাইন ইন হচ্ছে…",
    email: "ইমেল ঠিকানা", password: "পাসওয়ার্ড", createAccount: "অ্যাকাউন্ট তৈরি করুন",
    newToCommunity: "কমিউনিটিতে নতুন?", verifyEmail: "ইমেল যাচাই করুন",
  },
  {
    preferences: "পছন্দসমূহ", allSettings: "সব সেটিংস", languageDescription: "আপনার ইন্টারফেসের ভাষা বেছে নিন। পছন্দটি পরেরবারের জন্য সংরক্ষিত থাকবে।",
    account: "অ্যাকাউন্ট",
    availableLanguages: "উপলভ্য ভাষা", theme: "চেহারা", settingsTitle: "সেটিংস", settingsDescription: "আপনার অ্যাকাউন্টের পছন্দ পরিচালনা করুন।",
  }
);

const mr = sections(
  {
    language: "भाषा", selectLanguage: "भाषा निवडा", languages: "भाषा",
    currentLanguage: "सध्याची भाषा", savePreference: "तुमची निवड या डिव्हाइसवर जतन केली जाते.",
    coverageNotice: "सामान्य नेव्हिगेशन, साइन इन आणि भाषा सेटिंग्जचे भाषांतर केले आहे. इतर अनेक स्क्रीन आणि संदेश अजून इंग्रजीत आहेत; भाषांतर नसलेला मजकूर इंग्रजीत दिसेल.",
    themePreference: "थीम प्राधान्य",
    themeLight: "फिकट",
    themeDark: "गडद",
    themeSystem: "सिस्टम",
    nav: {
      passengerDashboard: "प्रवासी डॅशबोर्ड", driverDashboard: "चालक डॅशबोर्ड",
      findRides: "राइड शोधा", bookings: "बुकिंग", rideHistory: "राइड इतिहास",
      createRide: "राइड तयार करा", bookingRequests: "बुकिंग विनंत्या", liveTracking: "थेट ट्रॅकिंग",
      ratings: "रेटिंग आणि अभिप्राय", applicationStatus: "अर्जाची स्थिती",
      adminDashboard: "प्रशासक डॅशबोर्ड", reviewCenter: "पुनरावलोकन केंद्र",
      userManagement: "वापरकर्ता व्यवस्थापन", organizations: "संस्था",
      rideMonitoring: "राइड निरीक्षण", reports: "अहवाल आणि अभिप्राय", auditLog: "ऑडिट लॉग",
      notifications: "सूचना", settings: "सेटिंग्ज", help: "मदत आणि सहाय्य", profile: "प्रोफाइल",
      signOut: "साइन आउट", openMenu: "नेव्हिगेशन मेनू उघडा", closeMenu: "नेव्हिगेशन मेनू बंद करा",
    },
  },
  {
    welcomeBack: "पुन्हा स्वागत आहे", signIn: "साइन इन करा", signingIn: "साइन इन होत आहे…",
    email: "ईमेल पत्ता", password: "पासवर्ड", createAccount: "खाते तयार करा",
    newToCommunity: "समुदायात नवीन आहात?", verifyEmail: "ईमेलची पडताळणी करा",
  },
  {
    preferences: "प्राधान्ये", allSettings: "सर्व सेटिंग्ज", languageDescription: "तुमची इंटरफेस भाषा निवडा. तुमची निवड पुढील भेटीसाठी जतन केली जाईल.",
    account: "खाते",
    availableLanguages: "उपलब्ध भाषा", theme: "दिसणे", settingsTitle: "सेटिंग्ज", settingsDescription: "तुमच्या खात्याची प्राधान्ये व्यवस्थापित करा.",
  }
);

const ta = sections(
  {
    language: "மொழி", selectLanguage: "மொழியைத் தேர்ந்தெடுக்கவும்", languages: "மொழிகள்",
    currentLanguage: "தற்போதைய மொழி", savePreference: "உங்கள் தேர்வு இந்தச் சாதனத்தில் சேமிக்கப்படும்.",
    coverageNotice: "பொதுவான வழிசெலுத்தல், உள்நுழைவு மற்றும் மொழி அமைப்புகள் மொழிபெயர்க்கப்பட்டுள்ளன. பல திரைகளும் செய்திகளும் இன்னும் ஆங்கிலத்தில் உள்ளன; மொழிபெயர்க்கப்படாதவை ஆங்கிலத்தில் காட்டப்படும்.",
    themePreference: "தீம் விருப்பம்",
    themeLight: "ஒளி",
    themeDark: "இருள்",
    themeSystem: "சிஸ்டம்",
    nav: {
      passengerDashboard: "பயணி முகப்புப்பலகை", driverDashboard: "ஓட்டுநர் முகப்புப்பலகை",
      findRides: "பயணங்களைத் தேடு", bookings: "முன்பதிவுகள்", rideHistory: "பயண வரலாறு",
      createRide: "பயணத்தை உருவாக்கு", bookingRequests: "முன்பதிவு கோரிக்கைகள்", liveTracking: "நேரலை கண்காணிப்பு",
      ratings: "மதிப்பீடுகள் மற்றும் விமர்சனங்கள்", applicationStatus: "விண்ணப்ப நிலை",
      adminDashboard: "நிர்வாக முகப்புப்பலகை", reviewCenter: "மதிப்பாய்வு மையம்",
      userManagement: "பயனர் மேலாண்மை", organizations: "நிறுவனங்கள்",
      rideMonitoring: "பயண கண்காணிப்பு", reports: "அறிக்கைகள் மற்றும் விமர்சனங்கள்", auditLog: "தணிக்கை பதிவு",
      notifications: "அறிவிப்புகள்", settings: "அமைப்புகள்", help: "உதவி", profile: "சுயவிவரம்",
      signOut: "வெளியேறு", openMenu: "வழிசெலுத்தல் பட்டியைத் திற", closeMenu: "வழிசெலுத்தல் பட்டியை மூடு",
    },
  },
  {
    welcomeBack: "மீண்டும் வருக", signIn: "உள்நுழைக", signingIn: "உள்நுழைகிறது…",
    email: "மின்னஞ்சல் முகவரி", password: "கடவுச்சொல்", createAccount: "கணக்கை உருவாக்கு",
    newToCommunity: "சமூகத்திற்கு புதியவரா?", verifyEmail: "மின்னஞ்சலைச் சரிபார்",
  },
  {
    preferences: "விருப்பத்தேர்வுகள்", allSettings: "அனைத்து அமைப்புகள்", languageDescription: "இடைமுக மொழியைத் தேர்ந்தெடுக்கவும். உங்கள் தேர்வு அடுத்த வருகைக்கும் சேமிக்கப்படும்.",
    account: "கணக்கு",
    availableLanguages: "கிடைக்கும் மொழிகள்", theme: "தோற்றம்", settingsTitle: "அமைப்புகள்", settingsDescription: "கணக்கு விருப்பத்தேர்வுகளை நிர்வகிக்கவும்.",
  }
);

const te = sections(
  {
    language: "భాష", selectLanguage: "భాషను ఎంచుకోండి", languages: "భాషలు",
    currentLanguage: "ప్రస్తుత భాష", savePreference: "మీ ఎంపిక ఈ పరికరంలో సేవ్ అవుతుంది.",
    coverageNotice: "సాధారణ నావిగేషన్, సైన్ ఇన్ మరియు భాషా సెట్టింగ్‌లు అనువదించబడ్డాయి. అనేక స్క్రీన్‌లు, సందేశాలు ఇంకా ఇంగ్లీష్‌లోనే ఉన్నాయి; అనువాదం లేని వచనం ఇంగ్లీష్‌లో కనిపిస్తుంది.",
    themePreference: "థీమ్ ప్రాధాన్యత",
    themeLight: "లైట్",
    themeDark: "డార్క్",
    themeSystem: "సిస్టమ్",
    nav: {
      passengerDashboard: "ప్రయాణికుడి డ్యాష్‌బోర్డ్", driverDashboard: "డ్రైవర్ డ్యాష్‌బోర్డ్",
      findRides: "రైడ్‌లను వెతకండి", bookings: "బుకింగ్‌లు", rideHistory: "రైడ్ చరిత్ర",
      createRide: "రైడ్‌ను సృష్టించండి", bookingRequests: "బుకింగ్ అభ్యర్థనలు", liveTracking: "లైవ్ ట్రాకింగ్",
      ratings: "రేటింగ్‌లు మరియు సమీక్షలు", applicationStatus: "దరఖాస్తు స్థితి",
      adminDashboard: "అడ్మిన్ డ్యాష్‌బోర్డ్", reviewCenter: "సమీక్ష కేంద్రం",
      userManagement: "వినియోగదారుల నిర్వహణ", organizations: "సంస్థలు",
      rideMonitoring: "రైడ్ పర్యవేక్షణ", reports: "నివేదికలు మరియు సమీక్షలు", auditLog: "ఆడిట్ లాగ్",
      notifications: "నోటిఫికేషన్‌లు", settings: "సెట్టింగ్‌లు", help: "సహాయం", profile: "ప్రొఫైల్",
      signOut: "సైన్ అవుట్", openMenu: "నావిగేషన్ మెనుని తెరవండి", closeMenu: "నావిగేషన్ మెనుని మూసివేయండి",
    },
  },
  {
    welcomeBack: "తిరిగి స్వాగతం", signIn: "సైన్ ఇన్", signingIn: "సైన్ ఇన్ అవుతోంది…",
    email: "ఇమెయిల్ చిరునామా", password: "పాస్‌వర్డ్", createAccount: "ఖాతాను సృష్టించండి",
    newToCommunity: "సంఘానికి కొత్తవారా?", verifyEmail: "ఇమెయిల్‌ను ధృవీకరించండి",
  },
  {
    preferences: "ప్రాధాన్యతలు", allSettings: "అన్ని సెట్టింగ్‌లు", languageDescription: "మీ ఇంటర్‌ఫేస్ భాషను ఎంచుకోండి. మీ ఎంపిక తదుపరి సందర్శన కోసం సేవ్ అవుతుంది.",
    account: "ఖాతా",
    availableLanguages: "అందుబాటులో ఉన్న భాషలు", theme: "రూపం", settingsTitle: "సెట్టింగ్‌లు", settingsDescription: "మీ ఖాతా ప్రాధాన్యతలను నిర్వహించండి.",
  }
);

const gu = sections(
  {
    language: "ભાષા", selectLanguage: "ભાષા પસંદ કરો", languages: "ભાષાઓ",
    currentLanguage: "વર્તમાન ભાષા", savePreference: "તમારી પસંદગી આ ઉપકરણ પર સાચવવામાં આવે છે.",
    coverageNotice: "સામાન્ય નેવિગેશન, સાઇન ઇન અને ભાષા સેટિંગ્સનું ભાષાંતર છે. અન્ય ઘણા સ્ક્રીન અને સંદેશા હજી અંગ્રેજીમાં છે; અનુવાદ વિનાનો લખાણ અંગ્રેજીમાં દેખાશે.",
    themePreference: "થીમ પસંદગી",
    themeLight: "લાઇટ",
    themeDark: "ડાર્ક",
    themeSystem: "સિસ્ટમ",
    nav: {
      passengerDashboard: "પ્રવાસી ડેશબોર્ડ", driverDashboard: "ડ્રાઇવર ડેશબોર્ડ",
      findRides: "રાઇડ શોધો", bookings: "બુકિંગ", rideHistory: "રાઇડ ઇતિહાસ",
      createRide: "રાઇડ બનાવો", bookingRequests: "બુકિંગ વિનંતીઓ", liveTracking: "લાઇવ ટ્રેકિંગ",
      ratings: "રેટિંગ અને સમીક્ષાઓ", applicationStatus: "અરજીની સ્થિતિ",
      adminDashboard: "એડમિન ડેશબોર્ડ", reviewCenter: "સમીક્ષા કેન્દ્ર",
      userManagement: "વપરાશકર્તા વ્યવસ્થાપન", organizations: "સંસ્થાઓ",
      rideMonitoring: "રાઇડ દેખરેખ", reports: "અહેવાલો અને સમીક્ષાઓ", auditLog: "ઑડિટ લોગ",
      notifications: "સૂચનાઓ", settings: "સેટિંગ્સ", help: "મદદ અને સહાય", profile: "પ્રોફાઇલ",
      signOut: "સાઇન આઉટ", openMenu: "નેવિગેશન મેનૂ ખોલો", closeMenu: "નેવિગેશન મેનૂ બંધ કરો",
    },
  },
  {
    welcomeBack: "ફરી સ્વાગત છે", signIn: "સાઇન ઇન કરો", signingIn: "સાઇન ઇન થઈ રહ્યું છે…",
    email: "ઈમેલ સરનામું", password: "પાસવર્ડ", createAccount: "ખાતું બનાવો",
    newToCommunity: "સમુદાયમાં નવા છો?", verifyEmail: "ઈમેલ ચકાસો",
  },
  {
    preferences: "પસંદગીઓ", allSettings: "બધી સેટિંગ્સ", languageDescription: "તમારી ઇન્ટરફેસ ભાષા પસંદ કરો. તમારી પસંદગી આગળની મુલાકાત માટે સાચવવામાં આવશે.",
    account: "ખાતું",
    availableLanguages: "ઉપલબ્ધ ભાષાઓ", theme: "દેખાવ", settingsTitle: "સેટિંગ્સ", settingsDescription: "તમારા ખાતાની પસંદગીઓ સંચાલિત કરો.",
  }
);

const kn = sections(
  {
    language: "ಭಾಷೆ", selectLanguage: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ", languages: "ಭಾಷೆಗಳು",
    currentLanguage: "ಪ್ರಸ್ತುತ ಭಾಷೆ", savePreference: "ನಿಮ್ಮ ಆಯ್ಕೆಯನ್ನು ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗುತ್ತದೆ.",
    coverageNotice: "ಸಾಮಾನ್ಯ ನ್ಯಾವಿಗೇಶನ್, ಸೈನ್ ಇನ್ ಮತ್ತು ಭಾಷಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಅನುವಾದಿಸಲಾಗಿದೆ. ಅನೇಕ ಪರದೆಗಳು ಮತ್ತು ಸಂದೇಶಗಳು ಇನ್ನೂ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿವೆ; ಅನುವಾದವಿಲ್ಲದ ಪಠ್ಯ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.",
    themePreference: "ಥೀಮ್ ಆದ್ಯತೆ",
    themeLight: "ಲೈಟ್",
    themeDark: "ಡಾರ್ಕ್",
    themeSystem: "ಸಿಸ್ಟಮ್",
    nav: {
      passengerDashboard: "ಪ್ರಯಾಣಿಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", driverDashboard: "ಚಾಲಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      findRides: "ರೈಡ್‌ಗಳನ್ನು ಹುಡುಕಿ", bookings: "ಬುಕಿಂಗ್‌ಗಳು", rideHistory: "ರೈಡ್ ಇತಿಹಾಸ",
      createRide: "ರೈಡ್ ರಚಿಸಿ", bookingRequests: "ಬುಕಿಂಗ್ ವಿನಂತಿಗಳು", liveTracking: "ನೇರ ಟ್ರ್ಯಾಕಿಂಗ್",
      ratings: "ರೇಟಿಂಗ್‌ಗಳು ಮತ್ತು ವಿಮರ್ಶೆಗಳು", applicationStatus: "ಅರ್ಜಿಯ ಸ್ಥಿತಿ",
      adminDashboard: "ನಿರ್ವಾಹಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", reviewCenter: "ವಿಮರ್ಶಾ ಕೇಂದ್ರ",
      userManagement: "ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ", organizations: "ಸಂಸ್ಥೆಗಳು",
      rideMonitoring: "ರೈಡ್ ಮೇಲ್ವಿಚಾರಣೆ", reports: "ವರದಿಗಳು ಮತ್ತು ವಿಮರ್ಶೆಗಳು", auditLog: "ಆಡಿಟ್ ಲಾಗ್",
      notifications: "ಅಧಿಸೂಚನೆಗಳು", settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", help: "ಸಹಾಯ", profile: "ಪ್ರೊಫೈಲ್",
      signOut: "ಸೈನ್ ಔಟ್", openMenu: "ನ್ಯಾವಿಗೇಶನ್ ಮೆನು ತೆರೆಯಿರಿ", closeMenu: "ನ್ಯಾವಿಗೇಶನ್ ಮೆನು ಮುಚ್ಚಿರಿ",
    },
  },
  {
    welcomeBack: "ಮರಳಿ ಸ್ವಾಗತ", signIn: "ಸೈನ್ ಇನ್", signingIn: "ಸೈನ್ ಇನ್ ಆಗುತ್ತಿದೆ…",
    email: "ಇಮೇಲ್ ವಿಳಾಸ", password: "ಪಾಸ್‌ವರ್ಡ್", createAccount: "ಖಾತೆ ರಚಿಸಿ",
    newToCommunity: "ಸಮುದಾಯಕ್ಕೆ ಹೊಸಬರೇ?", verifyEmail: "ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ",
  },
  {
    preferences: "ಆದ್ಯತೆಗಳು", allSettings: "ಎಲ್ಲಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳು", languageDescription: "ನಿಮ್ಮ ಇಂಟರ್ಫೇಸ್ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ನಿಮ್ಮ ಆಯ್ಕೆಯನ್ನು ಮುಂದಿನ ಭೇಟಿಗಾಗಿ ಉಳಿಸಲಾಗುತ್ತದೆ.",
    account: "ಖಾತೆ",
    availableLanguages: "ಲಭ್ಯವಿರುವ ಭಾಷೆಗಳು", theme: "ಗೋಚರತೆ", settingsTitle: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", settingsDescription: "ನಿಮ್ಮ ಖಾತೆಯ ಆದ್ಯತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ.",
  }
);

const ml = sections(
  {
    language: "ഭാഷ", selectLanguage: "ഭാഷ തിരഞ്ഞെടുക്കുക", languages: "ഭാഷകൾ",
    currentLanguage: "നിലവിലെ ഭാഷ", savePreference: "നിങ്ങളുടെ തിരഞ്ഞെടുപ്പ് ഈ ഉപകരണത്തിൽ സൂക്ഷിക്കും.",
    coverageNotice: "പൊതുവായ നാവിഗേഷൻ, സൈൻ ഇൻ, ഭാഷാ ക്രമീകരണങ്ങൾ എന്നിവ വിവർത്തനം ചെയ്തിട്ടുണ്ട്. പല സ്ക്രീനുകളും സന്ദേശങ്ങളും ഇപ്പോഴും ഇംഗ്ലീഷിലാണ്; വിവർത്തനം ചെയ്യാത്തവ ഇംഗ്ലീഷിൽ കാണിക്കും.",
    themePreference: "തീം മുൻഗണന",
    themeLight: "ലൈറ്റ്",
    themeDark: "ഡാർക്ക്",
    themeSystem: "സിസ്റ്റം",
    nav: {
      passengerDashboard: "യാത്രക്കാരുടെ ഡാഷ്ബോർഡ്", driverDashboard: "ഡ്രൈവർ ഡാഷ്ബോർഡ്",
      findRides: "യാത്രകൾ തിരയുക", bookings: "ബുക്കിങ്ങുകൾ", rideHistory: "യാത്രാ ചരിത്രം",
      createRide: "യാത്ര സൃഷ്ടിക്കുക", bookingRequests: "ബുക്കിങ് അഭ്യർത്ഥനകൾ", liveTracking: "തത്സമയ ട്രാക്കിംഗ്",
      ratings: "റേറ്റിങ്ങുകളും അവലോകനങ്ങളും", applicationStatus: "അപേക്ഷാ നില",
      adminDashboard: "അഡ്മിൻ ഡാഷ്ബോർഡ്", reviewCenter: "അവലോകന കേന്ദ്രം",
      userManagement: "ഉപയോക്തൃ മാനേജ്മെന്റ്", organizations: "സ്ഥാപനങ്ങൾ",
      rideMonitoring: "യാത്രാ നിരീക്ഷണം", reports: "റിപ്പോർട്ടുകളും അവലോകനങ്ങളും", auditLog: "ഓഡിറ്റ് ലോഗ്",
      notifications: "അറിയിപ്പുകൾ", settings: "ക്രമീകരണങ്ങൾ", help: "സഹായം", profile: "പ്രൊഫൈൽ",
      signOut: "സൈൻ ഔട്ട്", openMenu: "നാവിഗേഷൻ മെനു തുറക്കുക", closeMenu: "നാവിഗേഷൻ മെനു അടയ്ക്കുക",
    },
  },
  {
    welcomeBack: "വീണ്ടും സ്വാഗതം", signIn: "സൈൻ ഇൻ ചെയ്യുക", signingIn: "സൈൻ ഇൻ ചെയ്യുന്നു…",
    email: "ഇമെയിൽ വിലാസം", password: "പാസ്‌വേഡ്", createAccount: "അക്കൗണ്ട് സൃഷ്ടിക്കുക",
    newToCommunity: "സമൂഹത്തിൽ പുതുമുഖമാണോ?", verifyEmail: "ഇമെയിൽ പരിശോധിക്കുക",
  },
  {
    preferences: "മുൻഗണനകൾ", allSettings: "എല്ലാ ക്രമീകരണങ്ങളും", languageDescription: "ഇന്റർഫേസ് ഭാഷ തിരഞ്ഞെടുക്കുക. അടുത്ത സന്ദർശനത്തിനായി ഈ തിരഞ്ഞെടുപ്പ് സൂക്ഷിക്കും.",
    account: "അക്കൗണ്ട്",
    availableLanguages: "ലഭ്യമായ ഭാഷകൾ", theme: "രൂപഭാവം", settingsTitle: "ക്രമീകരണങ്ങൾ", settingsDescription: "അക്കൗണ്ട് മുൻഗണനകൾ നിയന്ത്രിക്കുക.",
  }
);

const pa = sections(
  {
    language: "ਭਾਸ਼ਾ", selectLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ", languages: "ਭਾਸ਼ਾਵਾਂ",
    currentLanguage: "ਮੌਜੂਦਾ ਭਾਸ਼ਾ", savePreference: "ਤੁਹਾਡੀ ਚੋਣ ਇਸ ਡਿਵਾਈਸ 'ਤੇ ਸੰਭਾਲੀ ਜਾਂਦੀ ਹੈ।",
    coverageNotice: "ਆਮ ਨੈਵੀਗੇਸ਼ਨ, ਸਾਈਨ ਇਨ ਅਤੇ ਭਾਸ਼ਾ ਸੈਟਿੰਗਾਂ ਦਾ ਅਨੁਵਾਦ ਕੀਤਾ ਗਿਆ ਹੈ। ਕਈ ਸਕ੍ਰੀਨਾਂ ਅਤੇ ਸੁਨੇਹੇ ਹਾਲੇ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਹਨ; ਅਨੁਵਾਦ ਨਾ ਹੋਇਆ ਲਿਖਤ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਦਿਖੇਗਾ।",
    themePreference: "ਥੀਮ ਤਰਜੀਹ",
    themeLight: "ਲਾਈਟ",
    themeDark: "ਡਾਰਕ",
    themeSystem: "ਸਿਸਟਮ",
    nav: {
      passengerDashboard: "ਯਾਤਰੀ ਡੈਸ਼ਬੋਰਡ", driverDashboard: "ਡਰਾਈਵਰ ਡੈਸ਼ਬੋਰਡ",
      findRides: "ਰਾਈਡਾਂ ਲੱਭੋ", bookings: "ਬੁਕਿੰਗਾਂ", rideHistory: "ਰਾਈਡ ਇਤਿਹਾਸ",
      createRide: "ਰਾਈਡ ਬਣਾਓ", bookingRequests: "ਬੁਕਿੰਗ ਬੇਨਤੀਆਂ", liveTracking: "ਲਾਈਵ ਟ੍ਰੈਕਿੰਗ",
      ratings: "ਰੇਟਿੰਗ ਅਤੇ ਸਮੀਖਿਆਵਾਂ", applicationStatus: "ਅਰਜ਼ੀ ਦੀ ਸਥਿਤੀ",
      adminDashboard: "ਐਡਮਿਨ ਡੈਸ਼ਬੋਰਡ", reviewCenter: "ਸਮੀਖਿਆ ਕੇਂਦਰ",
      userManagement: "ਵਰਤੋਂਕਾਰ ਪ੍ਰਬੰਧਨ", organizations: "ਸੰਸਥਾਵਾਂ",
      rideMonitoring: "ਰਾਈਡ ਨਿਗਰਾਨੀ", reports: "ਰਿਪੋਰਟਾਂ ਅਤੇ ਸਮੀਖਿਆਵਾਂ", auditLog: "ਆਡਿਟ ਲੌਗ",
      notifications: "ਸੂਚਨਾਵਾਂ", settings: "ਸੈਟਿੰਗਾਂ", help: "ਮਦਦ ਅਤੇ ਸਹਾਇਤਾ", profile: "ਪ੍ਰੋਫ਼ਾਈਲ",
      signOut: "ਸਾਈਨ ਆਉਟ", openMenu: "ਨੈਵੀਗੇਸ਼ਨ ਮੀਨੂ ਖੋਲ੍ਹੋ", closeMenu: "ਨੈਵੀਗੇਸ਼ਨ ਮੀਨੂ ਬੰਦ ਕਰੋ",
    },
  },
  {
    welcomeBack: "ਵਾਪਸੀ 'ਤੇ ਜੀ ਆਇਆਂ ਨੂੰ", signIn: "ਸਾਈਨ ਇਨ ਕਰੋ", signingIn: "ਸਾਈਨ ਇਨ ਹੋ ਰਿਹਾ ਹੈ…",
    email: "ਈਮੇਲ ਪਤਾ", password: "ਪਾਸਵਰਡ", createAccount: "ਖਾਤਾ ਬਣਾਓ",
    newToCommunity: "ਭਾਈਚਾਰੇ ਵਿੱਚ ਨਵੇਂ ਹੋ?", verifyEmail: "ਈਮੇਲ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ",
  },
  {
    preferences: "ਤਰਜੀਹਾਂ", allSettings: "ਸਾਰੀਆਂ ਸੈਟਿੰਗਾਂ", languageDescription: "ਆਪਣੀ ਇੰਟਰਫੇਸ ਭਾਸ਼ਾ ਚੁਣੋ। ਤੁਹਾਡੀ ਚੋਣ ਅਗਲੀ ਵਾਰ ਲਈ ਸੰਭਾਲੀ ਜਾਵੇਗੀ।",
    account: "ਖਾਤਾ",
    availableLanguages: "ਉਪਲਬਧ ਭਾਸ਼ਾਵਾਂ", theme: "ਦਿੱਖ", settingsTitle: "ਸੈਟਿੰਗਾਂ", settingsDescription: "ਆਪਣੇ ਖਾਤੇ ਦੀਆਂ ਤਰਜੀਹਾਂ ਦਾ ਪ੍ਰਬੰਧ ਕਰੋ।",
  }
);

en.forms.labels = {
  emailAddress: "Email address",
  password: "Password",
  fullName: "Full name",
  phoneNumber: "Phone number",
  message: "Message",
};
en.forms.required = "This field is required.";
en.errors.unexpected = "Something went wrong. Please try again.";
hi.forms.labels = {
  emailAddress: "ईमेल पता",
  password: "पासवर्ड",
  fullName: "पूरा नाम",
  phoneNumber: "फ़ोन नंबर",
  message: "संदेश",
};
bn.forms.labels = {
  emailAddress: "ইমেল ঠিকানা",
  password: "পাসওয়ার্ড",
  fullName: "পুরো নাম",
  phoneNumber: "ফোন নম্বর",
  message: "বার্তা",
};
mr.forms.labels = {
  emailAddress: "ईमेल पत्ता",
  password: "पासवर्ड",
  fullName: "पूर्ण नाव",
  phoneNumber: "फोन नंबर",
  message: "संदेश",
};
ta.forms.labels = {
  emailAddress: "மின்னஞ்சல் முகவரி",
  password: "கடவுச்சொல்",
  fullName: "முழுப் பெயர்",
  phoneNumber: "தொலைபேசி எண்",
  message: "செய்தி",
};
te.forms.labels = {
  emailAddress: "ఇమెయిల్ చిరునామా",
  password: "పాస్‌వర్డ్",
  fullName: "పూర్తి పేరు",
  phoneNumber: "ఫోన్ నంబర్",
  message: "సందేశం",
};
gu.forms.labels = {
  emailAddress: "ઈમેલ સરનામું",
  password: "પાસવર્ડ",
  fullName: "પૂરું નામ",
  phoneNumber: "ફોન નંબર",
  message: "સંદેશ",
};
kn.forms.labels = {
  emailAddress: "ಇಮೇಲ್ ವಿಳಾಸ",
  password: "ಪಾಸ್‌ವರ್ಡ್",
  fullName: "ಪೂರ್ಣ ಹೆಸರು",
  phoneNumber: "ಫೋನ್ ಸಂಖ್ಯೆ",
  message: "ಸಂದೇಶ",
};
ml.forms.labels = {
  emailAddress: "ഇമെയിൽ വിലാസം",
  password: "പാസ്‌വേഡ്",
  fullName: "പൂർണ്ണ നാമം",
  phoneNumber: "ഫോൺ നമ്പർ",
  message: "സന്ദേശം",
};
pa.forms.labels = {
  emailAddress: "ਈਮੇਲ ਪਤਾ",
  password: "ਪਾਸਵਰਡ",
  fullName: "ਪੂਰਾ ਨਾਮ",
  phoneNumber: "ਫ਼ੋਨ ਨੰਬਰ",
  message: "ਸੁਨੇਹਾ",
};


export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  mr: { translation: mr },
  ta: { translation: ta },
  te: { translation: te },
  gu: { translation: gu },
  kn: { translation: kn },
  ml: { translation: ml },
  pa: { translation: pa },
};

const uiActions = {
  en: ["Search", "Search rides", "Searching…", "Clear filters", "Refresh", "Retry", "Previous", "Next", "Save", "Save changes", "Cancel", "Cancelling…", "Confirm", "Reject", "Submit", "Submitting…", "Publish ride", "Mark all read", "View", "Back", "Close"],
  hi: ["खोजें", "राइड खोजें", "खोज रहे हैं…", "फ़िल्टर हटाएँ", "रीफ़्रेश करें", "फिर कोशिश करें", "पिछला", "अगला", "सहेजें", "बदलाव सहेजें", "रद्द करें", "रद्द हो रहा है…", "पुष्टि करें", "अस्वीकार करें", "जमा करें", "जमा हो रहा है…", "राइड प्रकाशित करें", "सभी को पढ़ा हुआ चिह्नित करें", "देखें", "वापस", "बंद करें"],
  bn: ["খুঁজুন", "রাইড খুঁজুন", "খোঁজা হচ্ছে…", "ফিল্টার মুছুন", "রিফ্রেশ", "আবার চেষ্টা করুন", "আগের", "পরের", "সংরক্ষণ", "পরিবর্তন সংরক্ষণ", "বাতিল", "বাতিল হচ্ছে…", "নিশ্চিত করুন", "প্রত্যাখ্যান", "জমা দিন", "জমা হচ্ছে…", "রাইড প্রকাশ করুন", "সব পড়া হয়েছে হিসেবে চিহ্নিত করুন", "দেখুন", "ফিরে যান", "বন্ধ করুন"],
  mr: ["शोधा", "राइड शोधा", "शोधत आहे…", "फिल्टर काढा", "रीफ्रेश", "पुन्हा प्रयत्न करा", "मागील", "पुढील", "जतन करा", "बदल जतन करा", "रद्द करा", "रद्द करत आहे…", "पुष्टी करा", "नाकारा", "सबमिट करा", "सबमिट होत आहे…", "राइड प्रकाशित करा", "सर्व वाचलेले म्हणून चिन्हांकित करा", "पहा", "मागे", "बंद करा"],
  ta: ["தேடு", "பயணங்களைத் தேடு", "தேடுகிறது…", "வடிகட்டிகளை அழி", "புதுப்பி", "மீண்டும் முயற்சி", "முந்தையது", "அடுத்து", "சேமி", "மாற்றங்களைச் சேமி", "ரத்துசெய்", "ரத்துசெய்கிறது…", "உறுதிசெய்", "நிராகரி", "சமர்ப்பி", "சமர்ப்பிக்கிறது…", "பயணத்தை வெளியிடு", "அனைத்தையும் படித்ததாகக் குறி", "பார்", "பின் செல்", "மூடு"],
  te: ["వెతకండి", "రైడ్‌లను వెతకండి", "వెతుకుతోంది…", "ఫిల్టర్‌లను తొలగించండి", "రిఫ్రెష్", "మళ్లీ ప్రయత్నించండి", "మునుపటి", "తర్వాత", "సేవ్ చేయండి", "మార్పులను సేవ్ చేయండి", "రద్దు చేయండి", "రద్దవుతోంది…", "నిర్ధారించండి", "తిరస్కరించండి", "సమర్పించండి", "సమర్పిస్తోంది…", "రైడ్‌ను ప్రచురించండి", "అన్నీ చదివినట్లు గుర్తించండి", "చూడండి", "వెనక్కి", "మూసివేయండి"],
  gu: ["શોધો", "રાઇડ શોધો", "શોધી રહ્યા છીએ…", "ફિલ્ટર સાફ કરો", "રિફ્રેશ", "ફરી પ્રયાસ કરો", "પાછળ", "આગળ", "સાચવો", "ફેરફારો સાચવો", "રદ કરો", "રદ થઈ રહ્યું છે…", "ખાતરી કરો", "નકારો", "સબમિટ કરો", "સબમિટ થઈ રહ્યું છે…", "રાઇડ પ્રકાશિત કરો", "બધાને વાંચેલા તરીકે ચિહ્નિત કરો", "જુઓ", "પાછા", "બંધ કરો"],
  kn: ["ಹುಡುಕಿ", "ರೈಡ್‌ಗಳನ್ನು ಹುಡುಕಿ", "ಹುಡುಕುತ್ತಿದೆ…", "ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ", "ರಿಫ್ರೆಶ್", "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", "ಹಿಂದಿನದು", "ಮುಂದೆ", "ಉಳಿಸಿ", "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ", "ರದ್ದುಮಾಡಿ", "ರದ್ದುಮಾಡುತ್ತಿದೆ…", "ದೃಢೀಕರಿಸಿ", "ತಿರಸ್ಕರಿಸಿ", "ಸಲ್ಲಿಸಿ", "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ…", "ರೈಡ್ ಪ್ರಕಟಿಸಿ", "ಎಲ್ಲವನ್ನೂ ಓದಿದಂತೆ ಗುರುತಿಸಿ", "ವೀಕ್ಷಿಸಿ", "ಹಿಂದೆ", "ಮುಚ್ಚಿ"],
  ml: ["തിരയുക", "യാത്രകൾ തിരയുക", "തിരയുന്നു…", "ഫിൽട്ടറുകൾ മായ്ക്കുക", "പുതുക്കുക", "വീണ്ടും ശ്രമിക്കുക", "മുമ്പത്തേത്", "അടുത്തത്", "സേവ് ചെയ്യുക", "മാറ്റങ്ങൾ സേവ് ചെയ്യുക", "റദ്ദാക്കുക", "റദ്ദാക്കുന്നു…", "സ്ഥിരീകരിക്കുക", "നിരസിക്കുക", "സമർപ്പിക്കുക", "സമർപ്പിക്കുന്നു…", "യാത്ര പ്രസിദ്ധീകരിക്കുക", "എല്ലാം വായിച്ചതായി അടയാളപ്പെടുത്തുക", "കാണുക", "തിരികെ", "അടയ്ക്കുക"],
  pa: ["ਖੋਜੋ", "ਰਾਈਡਾਂ ਲੱਭੋ", "ਖੋਜ ਜਾਰੀ ਹੈ…", "ਫਿਲਟਰ ਸਾਫ਼ ਕਰੋ", "ਰਿਫ੍ਰੈਸ਼", "ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ", "ਪਿਛਲਾ", "ਅਗਲਾ", "ਸੰਭਾਲੋ", "ਤਬਦੀਲੀਆਂ ਸੰਭਾਲੋ", "ਰੱਦ ਕਰੋ", "ਰੱਦ ਹੋ ਰਿਹਾ ਹੈ…", "ਪੁਸ਼ਟੀ ਕਰੋ", "ਰੱਦ ਕਰੋ", "ਜਮ੍ਹਾਂ ਕਰੋ", "ਜਮ੍ਹਾਂ ਹੋ ਰਿਹਾ ਹੈ…", "ਰਾਈਡ ਪ੍ਰਕਾਸ਼ਿਤ ਕਰੋ", "ਸਭ ਨੂੰ ਪੜ੍ਹਿਆ ਹੋਇਆ ਨਿਸ਼ਾਨ ਲਗਾਓ", "ਵੇਖੋ", "ਵਾਪਸ", "ਬੰਦ ਕਰੋ"],
};

const uiActionKeys = [
  "search", "searchRides", "searching", "clearFilters", "refresh", "retry",
  "previous", "next", "save", "saveChanges", "cancel", "cancelling", "confirm",
  "reject", "submit", "submitting", "publishRide", "markAllRead", "view", "back", "close",
];
for (const [locale, values] of Object.entries(uiActions)) {
  resources[locale].translation.common.ui = {
    actions: Object.fromEntries(uiActionKeys.map((key, index) => [key, values[index]])),
    pages: {
      passengerDashboard: resources[locale].translation.common.nav.passengerDashboard,
      driverDashboard: resources[locale].translation.common.nav.driverDashboard,
      findRides: resources[locale].translation.common.nav.findRides,
      rideHistory: resources[locale].translation.common.nav.rideHistory,
      createRide: resources[locale].translation.common.nav.createRide,
      bookingRequests: resources[locale].translation.common.nav.bookingRequests,
      notifications: resources[locale].translation.common.nav.notifications,
      ratings: resources[locale].translation.common.nav.ratings,
      profile: resources[locale].translation.common.nav.profile,
      settings: resources[locale].translation.common.nav.settings,
      help: resources[locale].translation.common.nav.help,
      reviewCenter: resources[locale].translation.common.nav.reviewCenter,
      organizations: resources[locale].translation.common.nav.organizations,
      offerRide: locale === "en" ? "Offer a ride" : ({
        hi: "राइड ऑफ़र करें", bn: "রাইডের প্রস্তাব দিন", mr: "राइड ऑफर करा", ta: "பயணத்தை வழங்கு",
        te: "రైడ్‌ను అందించండి", gu: "રાઇડની ઑફર કરો", kn: "ರೈಡ್ ಒದಗಿಸಿ", ml: "യാത്ര വാഗ്ദാനം ചെയ്യുക", pa: "ਰਾਈਡ ਦੀ ਪੇਸ਼ਕਸ਼ ਕਰੋ",
      })[locale],
      rideDetails: locale === "en" ? "Ride details" : ({
        hi: "राइड का विवरण", bn: "রাইডের বিবরণ", mr: "राइड तपशील", ta: "பயண விவரங்கள்",
        te: "రైడ్ వివరాలు", gu: "રાઇડની વિગતો", kn: "ರೈಡ್ ವಿವರಗಳು", ml: "യാത്രാ വിവരങ്ങൾ", pa: "ਰਾਈਡ ਦੇ ਵੇਰਵੇ",
      })[locale],
      driverApplication: locale === "en" ? "Driver application" : ({
        hi: "ड्राइवर आवेदन", bn: "চালকের আবেদন", mr: "चालक अर्ज", ta: "ஓட்டுநர் விண்ணப்பம்",
        te: "డ్రైవర్ దరఖాస్తు", gu: "ડ્રાઇવર અરજી", kn: "ಚಾಲಕರ ಅರ್ಜಿ", ml: "ഡ്രൈവർ അപേക്ഷ", pa: "ਡਰਾਈਵਰ ਅਰਜ਼ੀ",
      })[locale],
      liveTracking: resources[locale].translation.common.nav.liveTracking,
      changePassword: locale === "en" ? "Change password" : ({
        hi: "पासवर्ड बदलें", bn: "পাসওয়ার্ড পরিবর্তন", mr: "पासवर्ड बदला", ta: "கடவுச்சொல்லை மாற்று",
        te: "పాస్‌వర్డ్ మార్చండి", gu: "પાસવર્ડ બદલો", kn: "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಿಸಿ", ml: "പാസ്‌വേഡ് മാറ്റുക", pa: "ਪਾਸਵਰਡ ਬਦਲੋ",
      })[locale],
      privacy: locale === "en" ? "Privacy policy" : ({
        hi: "गोपनीयता नीति", bn: "গোপনীয়তা নীতি", mr: "गोपनीयता धोरण", ta: "தனியுரிமைக் கொள்கை",
        te: "గోప్యతా విధానం", gu: "ગોપનીયતા નીતિ", kn: "ಗೌಪ್ಯತಾ ನೀತಿ", ml: "സ്വകാര്യതാ നയം", pa: "ਪਰਦੇਦਾਰੀ ਨੀਤੀ",
      })[locale],
      deleteAccount: locale === "en" ? "Delete account" : ({
        hi: "खाता हटाएँ", bn: "অ্যাকাউন্ট মুছুন", mr: "खाते हटवा", ta: "கணக்கை நீக்கு",
        te: "ఖాతాను తొలగించండి", gu: "ખાતું કાઢી નાખો", kn: "ಖಾತೆಯನ್ನು ಅಳಿಸಿ", ml: "അക്കൗണ്ട് ഇല്ലാതാക്കുക", pa: "ਖਾਤਾ ਮਿਟਾਓ",
      })[locale],
      referrals: locale === "en" ? "Refer & earn" : ({
        hi: "रेफ़र करें और कमाएँ", bn: "রেফার করুন ও উপার্জন করুন", mr: "रेफर करा आणि कमवा", ta: "பரிந்துரைத்து சம்பாதிக்கவும்",
        te: "సూచించి సంపాదించండి", gu: "રેફર કરો અને કમાઓ", kn: "ಶಿಫಾರಸು ಮಾಡಿ ಮತ್ತು ಗಳಿಸಿ", ml: "ശുപാർശ ചെയ്ത് നേടുക", pa: "ਹਵਾਲਾ ਦਿਓ ਤੇ ਕਮਾਓ",
      })[locale],
      contact: locale === "en" ? "Contact AVONEX" : ({
        hi: "AVONEX से संपर्क करें", bn: "AVONEX-এর সঙ্গে যোগাযোগ", mr: "AVONEX शी संपर्क साधा", ta: "AVONEX-ஐத் தொடர்புகொள்",
        te: "AVONEX‌ను సంప్రదించండి", gu: "AVONEXનો સંપર્ક કરો", kn: "AVONEX ಅನ್ನು ಸಂಪರ್ಕಿಸಿ", ml: "AVONEX-നെ ബന്ധപ്പെടുക", pa: "AVONEX ਨਾਲ ਸੰਪਰਕ ਕਰੋ",
      })[locale],
    },
    states: {
      loading: locale === "en" ? "Loading…" : ({
        hi: "लोड हो रहा है…", bn: "লোড হচ্ছে…", mr: "लोड होत आहे…", ta: "ஏற்றுகிறது…",
        te: "లోడ్ అవుతోంది…", gu: "લોડ થઈ રહ્યું છે…", kn: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…", ml: "ലോഡ് ചെയ്യുന്നു…", pa: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…",
      })[locale],
      pageOf: locale === "en" ? "Page {{page}} of {{total}}" : ({
        hi: "पृष्ठ {{page}}, कुल {{total}} में से", bn: "{{total}}টির মধ্যে পৃষ্ঠা {{page}}", mr: "{{total}} पैकी पृष्ठ {{page}}",
        ta: "{{total}} பக்கங்களில் {{page}}-ஆம் பக்கம்", te: "{{total}}లో {{page}}వ పేజీ", gu: "{{total}}માંથી પાનું {{page}}",
        kn: "{{total}}ರಲ್ಲಿ {{page}}ನೇ ಪುಟ", ml: "{{total}}-ൽ {{page}}-ാം പേജ്", pa: "{{total}} ਵਿੱਚੋਂ ਪੰਨਾ {{page}}",
      })[locale],
    },
  };
}

const uiOptionKeys = [
  "allRoles", "allStatuses", "allAccounts", "active", "inactive", "pending", "approved",
  "verified", "rejected", "confirmed", "cancelled", "completed", "reviewed", "resolved",
  "passenger", "driver", "organizationAdmin", "superAdmin", "allBookings", "upcomingRides",
  "completedRides", "newestFirst", "oldestFirst", "allNotifications", "unread", "read",
  "allTypes", "passport", "nationalId", "drivingLicence", "car", "bike", "company", "college",
  "university", "institute", "school", "institution", "other", "departureTime", "priceLowHigh",
  "priceHighLow", "pickupDistance", "departureEarliest", "departureLatest", "createdNewest",
  "createdOldest", "safetyConcern", "behaviorIssue", "paymentIssue", "otherRideIssue",
  "selectOrganization", "organizationAccount", "legacyUser",
];
const uiOptions = {
  en: ["All roles", "All statuses", "All accounts", "Active", "Inactive", "Pending", "Approved", "Verified", "Rejected", "Confirmed", "Cancelled", "Completed", "Reviewed", "Resolved", "Passenger", "Driver", "Organization admin", "SuperAdmin", "All bookings", "Upcoming rides", "Completed rides", "Newest first", "Oldest first", "All notifications", "Unread", "Read", "All types", "Passport", "National ID", "Driving licence", "Car", "Bike", "Company", "College", "University", "Institute", "School", "Institution", "Other", "Departure time", "Price: low to high", "Price: high to low", "Pickup distance", "Departure: earliest", "Departure: latest", "Created: newest", "Created: oldest", "Safety concern", "Driver or passenger behaviour", "Payment issue", "Other ride issue", "Select an organization", "Organization account", "Legacy user"],
  hi: ["सभी भूमिकाएँ", "सभी स्थितियाँ", "सभी खाते", "सक्रिय", "निष्क्रिय", "लंबित", "स्वीकृत", "सत्यापित", "अस्वीकृत", "पुष्ट", "रद्द", "पूर्ण", "समीक्षित", "हल किया गया", "यात्री", "ड्राइवर", "संस्थान व्यवस्थापक", "सुपर एडमिन", "सभी बुकिंग", "आगामी राइड", "पूरी हुई राइड", "पहले नवीनतम", "पहले सबसे पुराना", "सभी सूचनाएँ", "अपठित", "पढ़ी हुई", "सभी प्रकार", "पासपोर्ट", "राष्ट्रीय पहचान पत्र", "ड्राइविंग लाइसेंस", "कार", "बाइक", "कंपनी", "कॉलेज", "विश्वविद्यालय", "संस्थान", "स्कूल", "संस्था", "अन्य", "प्रस्थान का समय", "कम कीमत पहले", "अधिक कीमत पहले", "पिकअप दूरी", "सबसे पहले प्रस्थान", "सबसे बाद में प्रस्थान", "सबसे नई प्रविष्टि", "सबसे पुरानी प्रविष्टि", "सुरक्षा संबंधी चिंता", "ड्राइवर या यात्री का व्यवहार", "भुगतान समस्या", "राइड की अन्य समस्या", "संस्थान चुनें", "संस्थान खाता", "पुराना उपयोगकर्ता"],
  bn: ["সব ভূমিকা", "সব অবস্থা", "সব অ্যাকাউন্ট", "সক্রিয়", "নিষ্ক্রিয়", "অপেক্ষমাণ", "অনুমোদিত", "যাচাইকৃত", "প্রত্যাখ্যাত", "নিশ্চিত", "বাতিল", "সম্পন্ন", "পর্যালোচিত", "সমাধান হয়েছে", "যাত্রী", "চালক", "প্রতিষ্ঠান অ্যাডমিন", "সুপার অ্যাডমিন", "সব বুকিং", "আসন্ন রাইড", "সম্পন্ন রাইড", "নতুন আগে", "পুরোনো আগে", "সব বিজ্ঞপ্তি", "অপঠিত", "পঠিত", "সব ধরন", "পাসপোর্ট", "জাতীয় পরিচয়পত্র", "ড্রাইভিং লাইসেন্স", "গাড়ি", "বাইক", "কোম্পানি", "কলেজ", "বিশ্ববিদ্যালয়", "ইনস্টিটিউট", "স্কুল", "প্রতিষ্ঠান", "অন্যান্য", "যাত্রার সময়", "কম দাম আগে", "বেশি দাম আগে", "পিকআপের দূরত্ব", "আগে যাত্রা", "পরে যাত্রা", "নতুন তৈরি আগে", "পুরোনো তৈরি আগে", "নিরাপত্তা উদ্বেগ", "চালক বা যাত্রীর আচরণ", "পেমেন্ট সমস্যা", "অন্য রাইড সমস্যা", "প্রতিষ্ঠান বেছে নিন", "প্রতিষ্ঠানের অ্যাকাউন্ট", "পুরোনো ব্যবহারকারী"],
  mr: ["सर्व भूमिका", "सर्व स्थिती", "सर्व खाती", "सक्रिय", "निष्क्रिय", "प्रलंबित", "मंजूर", "सत्यापित", "नाकारणे", "निश्चित", "रद्द", "पूर्ण", "पुनरावलोकित", "निराकरण झाले", "प्रवासी", "चालक", "संस्था प्रशासक", "सुपर प्रशासक", "सर्व बुकिंग", "आगामी राइड", "पूर्ण राइड", "नवीन प्रथम", "जुने प्रथम", "सर्व सूचना", "न वाचलेले", "वाचलेले", "सर्व प्रकार", "पासपोर्ट", "राष्ट्रीय ओळखपत्र", "ड्रायव्हिंग लायसन्स", "कार", "बाइक", "कंपनी", "कॉलेज", "विद्यापीठ", "संस्थान", "शाळा", "संस्था", "इतर", "प्रस्थान वेळ", "कमी किंमत प्रथम", "जास्त किंमत प्रथम", "पिकअप अंतर", "लवकर प्रस्थान", "उशीरा प्रस्थान", "नवीन निर्मिती प्रथम", "जुनी निर्मिती प्रथम", "सुरक्षा चिंता", "चालक किंवा प्रवाशाचे वर्तन", "पेमेंट समस्या", "इतर राइड समस्या", "संस्था निवडा", "संस्थेचे खाते", "जुना वापरकर्ता"],
  ta: ["அனைத்து பங்குகள்", "அனைத்து நிலைகள்", "அனைத்து கணக்குகள்", "செயலில்", "செயலற்றது", "நிலுவையில்", "அங்கீகரிக்கப்பட்டது", "சரிபார்க்கப்பட்டது", "நிராகரிக்கப்பட்டது", "உறுதிசெய்யப்பட்டது", "ரத்துசெய்யப்பட்டது", "முடிந்தது", "மதிப்பாய்வு செய்யப்பட்டது", "தீர்க்கப்பட்டது", "பயணி", "ஓட்டுநர்", "நிறுவன நிர்வாகி", "சூப்பர் நிர்வாகி", "அனைத்து முன்பதிவுகள்", "வரவிருக்கும் பயணங்கள்", "முடிந்த பயணங்கள்", "புதியது முதலில்", "பழையது முதலில்", "அனைத்து அறிவிப்புகள்", "படிக்காதவை", "படித்தவை", "அனைத்து வகைகள்", "கடவுச்சீட்டு", "தேசிய அடையாள அட்டை", "ஓட்டுநர் உரிமம்", "கார்", "பைக்", "நிறுவனம்", "கல்லூரி", "பல்கலைக்கழகம்", "கல்வி நிறுவனம்", "பள்ளி", "நிறுவனம்", "மற்றவை", "புறப்படும் நேரம்", "குறைந்த விலை முதலில்", "அதிக விலை முதலில்", "பிக்-அப் தூரம்", "முன்னதாக புறப்படுவது", "தாமதமாக புறப்படுவது", "புதியது உருவாக்கியவை முதலில்", "பழையது உருவாக்கியவை முதலில்", "பாதுகாப்பு கவலை", "ஓட்டுநர் அல்லது பயணி நடத்தை", "கட்டணச் சிக்கல்", "பிற பயணச் சிக்கல்", "நிறுவனத்தைத் தேர்ந்தெடு", "நிறுவனக் கணக்கு", "பழைய பயனர்"],
  te: ["అన్ని పాత్రలు", "అన్ని స్థితులు", "అన్ని ఖాతాలు", "క్రియాశీలం", "నిష్క్రియం", "పెండింగ్", "ఆమోదించబడింది", "ధృవీకరించబడింది", "తిరస్కరించబడింది", "నిర్ధారించబడింది", "రద్దు చేయబడింది", "పూర్తయింది", "సమీక్షించబడింది", "పరిష్కరించబడింది", "ప్రయాణికుడు", "డ్రైవర్", "సంస్థ అడ్మిన్", "సూపర్ అడ్మిన్", "అన్ని బుకింగ్‌లు", "రాబోయే రైడ్‌లు", "పూర్తయిన రైడ్‌లు", "కొత్తవి ముందు", "పాతవి ముందు", "అన్ని నోటిఫికేషన్‌లు", "చదవనివి", "చదివినవి", "అన్ని రకాలు", "పాస్‌పోర్ట్", "జాతీయ గుర్తింపు కార్డు", "డ్రైవింగ్ లైసెన్స్", "కారు", "బైక్", "కంపెనీ", "కాలేజ్", "విశ్వవిద్యాలయం", "ఇన్‌స్టిట్యూట్", "పాఠశాల", "సంస్థ", "ఇతర", "ప్రయాణ సమయం", "తక్కువ ధర ముందుగా", "ఎక్కువ ధర ముందుగా", "పికప్ దూరం", "ముందుగా బయలుదేరు", "తర్వాత బయలుదేరు", "కొత్తగా సృష్టించినవి ముందు", "పాతవి ముందు", "భద్రతా సమస్య", "డ్రైవర్ లేదా ప్రయాణికుడి ప్రవర్తన", "చెల్లింపు సమస్య", "ఇతర రైడ్ సమస్య", "సంస్థను ఎంచుకోండి", "సంస్థ ఖాతా", "పాత వినియోగదారు"],
  gu: ["બધી ભૂમિકાઓ", "બધી સ્થિતિઓ", "બધા ખાતા", "સક્રિય", "નિષ્ક્રિય", "બાકી", "મંજૂર", "ચકાસાયેલ", "નકારાયેલ", "પુષ્ટિ", "રદ", "પૂર્ણ", "સમીક્ષિત", "ઉકેલાયેલ", "પ્રવાસી", "ડ્રાઇવર", "સંસ્થા એડમિન", "સુપર એડમિન", "બધી બુકિંગ", "આગામી રાઇડ", "પૂર્ણ થયેલી રાઇડ", "નવું પહેલાં", "જૂનું પહેલાં", "બધી સૂચનાઓ", "ન વાંચેલી", "વાંચેલી", "બધા પ્રકાર", "પાસપોર્ટ", "રાષ્ટ્રીય ઓળખપત્ર", "ડ્રાઇવિંગ લાઇસન્સ", "કાર", "બાઇક", "કંપની", "કોલેજ", "યુનિવર્સિટી", "ઇન્સ્ટિટ્યૂટ", "શાળા", "સંસ્થા", "અન્ય", "પ્રસ્થાન સમય", "ઓછી કિંમત પહેલાં", "વધુ કિંમત પહેલાં", "પિકઅપ અંતર", "વહેલું પ્રસ્થાન", "મોડું પ્રસ્થાન", "નવું પહેલાં", "જૂનું પહેલાં", "સલામતીની ચિંતા", "ડ્રાઇવર અથવા પ્રવાસીનું વર્તન", "ચુકવણી સમસ્યા", "અન્ય રાઇડ સમસ્યા", "સંસ્થા પસંદ કરો", "સંસ્થાનું ખાતું", "જૂનો વપરાશકર્તા"],
  kn: ["ಎಲ್ಲಾ ಪಾತ್ರಗಳು", "ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು", "ಎಲ್ಲಾ ಖಾತೆಗಳು", "ಸಕ್ರಿಯ", "ನಿಷ್ಕ್ರಿಯ", "ಬಾಕಿ", "ಅನುಮೋದಿತ", "ಪರಿಶೀಲಿಸಲಾಗಿದೆ", "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ", "ದೃಢೀಕರಿಸಲಾಗಿದೆ", "ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ", "ಪೂರ್ಣಗೊಂಡಿದೆ", "ವಿಮರ್ಶಿಸಲಾಗಿದೆ", "ಪರಿಹರಿಸಲಾಗಿದೆ", "ಪ್ರಯಾಣಿಕ", "ಚಾಲಕ", "ಸಂಸ್ಥೆಯ ನಿರ್ವಾಹಕ", "ಸೂಪರ್ ನಿರ್ವಾಹಕ", "ಎಲ್ಲಾ ಬುಕಿಂಗ್‌ಗಳು", "ಮುಂಬರುವ ರೈಡ್‌ಗಳು", "ಪೂರ್ಣಗೊಂಡ ರೈಡ್‌ಗಳು", "ಹೊಸದು ಮೊದಲು", "ಹಳೆಯದು ಮೊದಲು", "ಎಲ್ಲಾ ಅಧಿಸೂಚನೆಗಳು", "ಓದದವು", "ಓದಿದವು", "ಎಲ್ಲಾ ಪ್ರಕಾರಗಳು", "ಪಾಸ್‌ಪೋರ್ಟ್", "ರಾಷ್ಟ್ರೀಯ ಗುರುತಿನ ಚೀಟಿ", "ಚಾಲನಾ ಪರವಾನಗಿ", "ಕಾರು", "ಬೈಕ್", "ಕಂಪನಿ", "ಕಾಲೇಜು", "ವಿಶ್ವವಿದ್ಯಾಲಯ", "ಸಂಸ್ಥೆ", "ಶಾಲೆ", "ಸಂಸ್ಥೆ", "ಇತರೆ", "ನಿರ್ಗಮನ ಸಮಯ", "ಕಡಿಮೆ ಬೆಲೆ ಮೊದಲು", "ಹೆಚ್ಚಿನ ಬೆಲೆ ಮೊದಲು", "ಪಿಕಪ್ ದೂರ", "ಬೇಗ ನಿರ್ಗಮನ", "ತಡ ನಿರ್ಗಮನ", "ಹೊಸದಾಗಿ ರಚಿಸಿದವು ಮೊದಲು", "ಹಳೆಯದು ಮೊದಲು", "ಸುರಕ್ಷತಾ ಕಾಳಜಿ", "ಚಾಲಕ ಅಥವಾ ಪ್ರಯಾಣಿಕರ ವರ್ತನೆ", "ಪಾವತಿ ಸಮಸ್ಯೆ", "ಇತರೆ ರೈಡ್ ಸಮಸ್ಯೆ", "ಸಂಸ್ಥೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ", "ಸಂಸ್ಥೆಯ ಖಾತೆ", "ಹಳೆಯ ಬಳಕೆದಾರ"],
  ml: ["എല്ലാ റോളുകളും", "എല്ലാ നിലകളും", "എല്ലാ അക്കൗണ്ടുകളും", "സജീവം", "നിഷ്‌ക്രിയം", "തീർപ്പുകാത്ത്", "അംഗീകരിച്ചു", "സ്ഥിരീകരിച്ചു", "നിരസിച്ചു", "ഉറപ്പിച്ചു", "റദ്ദാക്കി", "പൂർത്തിയായി", "അവലോകനം ചെയ്തു", "പരിഹരിച്ചു", "യാത്രക്കാരൻ", "ഡ്രൈവർ", "സ്ഥാപന അഡ്മിൻ", "സൂപ്പർ അഡ്മിൻ", "എല്ലാ ബുക്കിങ്ങുകളും", "വരാനിരിക്കുന്ന യാത്രകൾ", "പൂർത്തിയായ യാത്രകൾ", "പുതിയത് ആദ്യം", "പഴയത് ആദ്യം", "എല്ലാ അറിയിപ്പുകളും", "വായിക്കാത്തത്", "വായിച്ചത്", "എല്ലാ തരങ്ങളും", "പാസ്പോർട്ട്", "ദേശീയ തിരിച്ചറിയൽ കാർഡ്", "ഡ്രൈവിങ് ലൈസൻസ്", "കാർ", "ബൈക്ക്", "കമ്പനി", "കോളേജ്", "സർവകലാശാല", "ഇൻസ്റ്റിറ്റ്യൂട്ട്", "സ്കൂൾ", "സ്ഥാപനം", "മറ്റുള്ളവ", "പുറപ്പെടുന്ന സമയം", "കുറഞ്ഞ നിരക്ക് ആദ്യം", "കൂടിയ നിരക്ക് ആദ്യം", "പിക്കപ്പ് ദൂരം", "നേരത്തെ പുറപ്പെടൽ", "വൈകിയ പുറപ്പെടൽ", "പുതിയത് ആദ്യം", "പഴയത് ആദ്യം", "സുരക്ഷാ ആശങ്ക", "ഡ്രൈവറുടെയോ യാത്രക്കാരന്റെയോ പെരുമാറ്റം", "പണമടയ്ക്കൽ പ്രശ്നം", "മറ്റ് യാത്രാ പ്രശ്നം", "സ്ഥാപനം തിരഞ്ഞെടുക്കുക", "സ്ഥാപന അക്കൗണ്ട്", "പഴയ ഉപയോക്താവ്"],
  pa: ["ਸਾਰੀਆਂ ਭੂਮਿਕਾਵਾਂ", "ਸਾਰੀਆਂ ਸਥਿਤੀਆਂ", "ਸਾਰੇ ਖਾਤੇ", "ਚਾਲੂ", "ਨਿਸ਼ਕਿਰਿਆ", "ਬਕਾਇਆ", "ਮਨਜ਼ੂਰ", "ਤਸਦੀਕਸ਼ੁਦਾ", "ਰੱਦ", "ਪੁਸ਼ਟੀਸ਼ੁਦਾ", "ਰੱਦ ਕੀਤਾ", "ਮੁਕੰਮਲ", "ਸਮੀਖਿਆ ਕੀਤੀ", "ਹੱਲ ਕੀਤਾ", "ਯਾਤਰੀ", "ਡਰਾਈਵਰ", "ਸੰਸਥਾ ਐਡਮਿਨ", "ਸੁਪਰ ਐਡਮਿਨ", "ਸਾਰੀਆਂ ਬੁਕਿੰਗਾਂ", "ਆਉਣ ਵਾਲੀਆਂ ਰਾਈਡਾਂ", "ਮੁਕੰਮਲ ਰਾਈਡਾਂ", "ਨਵੀਆਂ ਪਹਿਲਾਂ", "ਪੁਰਾਣੀਆਂ ਪਹਿਲਾਂ", "ਸਾਰੀਆਂ ਸੂਚਨਾਵਾਂ", "ਅਣਪੜ੍ਹੀਆਂ", "ਪੜ੍ਹੀਆਂ", "ਸਾਰੀਆਂ ਕਿਸਮਾਂ", "ਪਾਸਪੋਰਟ", "ਰਾਸ਼ਟਰੀ ਪਛਾਣ ਪੱਤਰ", "ਡਰਾਈਵਿੰਗ ਲਾਇਸੈਂਸ", "ਕਾਰ", "ਬਾਈਕ", "ਕੰਪਨੀ", "ਕਾਲਜ", "ਯੂਨੀਵਰਸਿਟੀ", "ਇੰਸਟੀਚਿਊਟ", "ਸਕੂਲ", "ਸੰਸਥਾ", "ਹੋਰ", "ਰਵਾਨਗੀ ਦਾ ਸਮਾਂ", "ਘੱਟ ਕੀਮਤ ਪਹਿਲਾਂ", "ਵੱਧ ਕੀਮਤ ਪਹਿਲਾਂ", "ਪਿਕਅੱਪ ਦੀ ਦੂਰੀ", "ਜਲਦੀ ਰਵਾਨਗੀ", "ਦੇਰ ਨਾਲ ਰਵਾਨਗੀ", "ਨਵੀਆਂ ਪਹਿਲਾਂ", "ਪੁਰਾਣੀਆਂ ਪਹਿਲਾਂ", "ਸੁਰੱਖਿਆ ਚਿੰਤਾ", "ਡਰਾਈਵਰ ਜਾਂ ਯਾਤਰੀ ਦਾ ਵਿਹਾਰ", "ਭੁਗਤਾਨ ਮਸਲਾ", "ਹੋਰ ਰਾਈਡ ਮਸਲਾ", "ਸੰਸਥਾ ਚੁਣੋ", "ਸੰਸਥਾ ਖਾਤਾ", "ਪੁਰਾਣਾ ਵਰਤੋਂਕਾਰ"],
};
for (const [locale, values] of Object.entries(uiOptions)) {
  resources[locale].translation.common.ui.options = Object.fromEntries(
    uiOptionKeys.map((key, index) => [key, values[index]])
  );
}

const uiLabelKeys = [
  "connectionLive", "connectionOffline", "connectionReconnecting", "platformWorkspace",
  "adminWorkspace", "organizationWorkspace", "driverPassenger", "driverApplicationWorkspace",
  "passengerWorkspace", "inactive", "profile", "emailVerified", "emailPending",
  "signedInAccount", "mainNavigation", "closeNavigation", "newNotification",
  "realtimeReconnecting",
];
const uiLabels = {
  en: ["Live", "Offline", "Reconnecting", "PLATFORM WORKSPACE", "ADMIN WORKSPACE", "ORGANIZATION WORKSPACE", "DRIVER & PASSENGER", "DRIVER APPLICATION", "PASSENGER WORKSPACE", "Inactive", "Profile", "Email verified", "Email pending", "Signed-in account", "Main navigation", "Close navigation menu", "NEW NOTIFICATION", "Live updates reconnecting. Your changes still use the secure API."],
  hi: ["लाइव", "ऑफ़लाइन", "पुनः कनेक्ट हो रहा है", "प्लेटफ़ॉर्म कार्यक्षेत्र", "एडमिन कार्यक्षेत्र", "संस्थान कार्यक्षेत्र", "ड्राइवर और यात्री", "ड्राइवर आवेदन", "यात्री कार्यक्षेत्र", "निष्क्रिय", "प्रोफ़ाइल", "ईमेल सत्यापित", "ईमेल लंबित", "साइन-इन खाता", "मुख्य नेविगेशन", "नेविगेशन मेनू बंद करें", "नई सूचना", "लाइव अपडेट फिर से कनेक्ट हो रहे हैं। आपके बदलाव सुरक्षित API के ज़रिए लागू होंगे।"],
  bn: ["লাইভ", "অফলাইন", "পুনরায় সংযোগ হচ্ছে", "প্ল্যাটফর্ম কর্মক্ষেত্র", "অ্যাডমিন কর্মক্ষেত্র", "প্রতিষ্ঠানের কর্মক্ষেত্র", "চালক ও যাত্রী", "চালকের আবেদন", "যাত্রীর কর্মক্ষেত্র", "নিষ্ক্রিয়", "প্রোফাইল", "ইমেল যাচাইকৃত", "ইমেল অপেক্ষমাণ", "সাইন-ইন অ্যাকাউন্ট", "প্রধান নেভিগেশন", "নেভিগেশন মেনু বন্ধ করুন", "নতুন বিজ্ঞপ্তি", "লাইভ আপডেট পুনরায় সংযোগ হচ্ছে। আপনার পরিবর্তন নিরাপদ API ব্যবহার করে চলবে।"],
  mr: ["थेट", "ऑफलाइन", "पुन्हा जोडत आहे", "प्लॅटफॉर्म कार्यक्षेत्र", "प्रशासक कार्यक्षेत्र", "संस्था कार्यक्षेत्र", "चालक आणि प्रवासी", "चालक अर्ज", "प्रवासी कार्यक्षेत्र", "निष्क्रिय", "प्रोफाइल", "ईमेल सत्यापित", "ईमेल प्रलंबित", "साइन इन केलेले खाते", "मुख्य नेव्हिगेशन", "नेव्हिगेशन मेनू बंद करा", "नवीन सूचना", "थेट अपडेट पुन्हा जोडत आहेत. तुमचे बदल सुरक्षित API द्वारेच होतील."],
  ta: ["நேரலை", "ஆஃப்லைன்", "மீண்டும் இணைகிறது", "தளப் பணியிடம்", "நிர்வாகப் பணியிடம்", "நிறுவனப் பணியிடம்", "ஓட்டுநர் மற்றும் பயணி", "ஓட்டுநர் விண்ணப்பம்", "பயணி பணியிடம்", "செயலற்றது", "சுயவிவரம்", "மின்னஞ்சல் சரிபார்க்கப்பட்டது", "மின்னஞ்சல் நிலுவையில்", "உள்நுழைந்த கணக்கு", "முதன்மை வழிசெலுத்தல்", "வழிசெலுத்தல் பட்டியை மூடு", "புதிய அறிவிப்பு", "நேரலை புதுப்பிப்புகள் மீண்டும் இணைகின்றன. உங்கள் மாற்றங்கள் பாதுகாப்பான API வழியாகச் செயல்படும்."],
  te: ["లైవ్", "ఆఫ్‌లైన్", "మళ్లీ కనెక్ట్ అవుతోంది", "ప్లాట్‌ఫారమ్ కార్యస్థలం", "అడ్మిన్ కార్యస్థలం", "సంస్థ కార్యస్థలం", "డ్రైవర్ మరియు ప్రయాణికుడు", "డ్రైవర్ దరఖాస్తు", "ప్రయాణికుడి కార్యస్థలం", "నిష్క్రియం", "ప్రొఫైల్", "ఇమెయిల్ ధృవీకరించబడింది", "ఇమెయిల్ పెండింగ్", "సైన్-ఇన్ ఖాతా", "ప్రధాన నావిగేషన్", "నావిగేషన్ మెనుని మూసివేయండి", "కొత్త నోటిఫికేషన్", "లైవ్ అప్‌డేట్‌లు మళ్లీ కనెక్ట్ అవుతున్నాయి. మీ మార్పులు సురక్షిత APIలో కొనసాగుతాయి."],
  gu: ["લાઇવ", "ઑફલાઇન", "ફરી જોડાઈ રહ્યું છે", "પ્લેટફોર્મ કાર્યસ્થળ", "એડમિન કાર્યસ્થળ", "સંસ્થા કાર્યસ્થળ", "ડ્રાઇવર અને પ્રવાસી", "ડ્રાઇવર અરજી", "પ્રવાસી કાર્યસ્થળ", "નિષ્ક્રિય", "પ્રોફાઇલ", "ઈમેલ ચકાસાયેલ", "ઈમેલ બાકી", "સાઇન-ઇન ખાતું", "મુખ્ય નેવિગેશન", "નેવિગેશન મેનૂ બંધ કરો", "નવી સૂચના", "લાઇવ અપડેટ ફરી જોડાઈ રહ્યા છે. તમારા ફેરફારો સુરક્ષિત API દ્વારા ચાલુ રહેશે."],
  kn: ["ನೇರ", "ಆಫ್‌ಲೈನ್", "ಮತ್ತೆ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ", "ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಕಾರ್ಯಸ್ಥಳ", "ನಿರ್ವಾಹಕರ ಕಾರ್ಯಸ್ಥಳ", "ಸಂಸ್ಥೆಯ ಕಾರ್ಯಸ್ಥಳ", "ಚಾಲಕ ಮತ್ತು ಪ್ರಯಾಣಿಕ", "ಚಾಲಕರ ಅರ್ಜಿ", "ಪ್ರಯಾಣಿಕರ ಕಾರ್ಯಸ್ಥಳ", "ನಿಷ್ಕ್ರಿಯ", "ಪ್ರೊಫೈಲ್", "ಇಮೇಲ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ", "ಇಮೇಲ್ ಬಾಕಿಯಿದೆ", "ಸೈನ್-ಇನ್ ಖಾತೆ", "ಮುಖ್ಯ ನ್ಯಾವಿಗೇಶನ್", "ನ್ಯಾವಿಗೇಶನ್ ಮೆನು ಮುಚ್ಚಿರಿ", "ಹೊಸ ಅಧಿಸೂಚನೆ", "ನೇರ ಅಪ್‌ಡೇಟ್‌ಗಳು ಮತ್ತೆ ಸಂಪರ್ಕಗೊಳ್ಳುತ್ತಿವೆ. ನಿಮ್ಮ ಬದಲಾವಣೆಗಳು ಸುರಕ್ಷಿತ API ಮೂಲಕ ಮುಂದುವರಿಯುತ್ತವೆ."],
  ml: ["തത്സമയം", "ഓഫ്‌ലൈൻ", "വീണ്ടും ബന്ധിപ്പിക്കുന്നു", "പ്ലാറ്റ്ഫോം ഇടം", "അഡ്മിൻ ഇടം", "സ്ഥാപന ഇടം", "ഡ്രൈവറും യാത്രക്കാരനും", "ഡ്രൈവർ അപേക്ഷ", "യാത്രക്കാരുടെ ഇടം", "നിഷ്‌ക്രിയം", "പ്രൊഫൈൽ", "ഇമെയിൽ സ്ഥിരീകരിച്ചു", "ഇമെയിൽ കാത്തിരിക്കുന്നു", "സൈൻ ഇൻ ചെയ്ത അക്കൗണ്ട്", "പ്രധാന നാവിഗേഷൻ", "നാവിഗേഷൻ മെനു അടയ്ക്കുക", "പുതിയ അറിയിപ്പ്", "തത്സമയ അപ്‌ഡേറ്റുകൾ വീണ്ടും ബന്ധിപ്പിക്കുന്നു. നിങ്ങളുടെ മാറ്റങ്ങൾ സുരക്ഷിത API വഴി തുടരും."],
  pa: ["ਲਾਈਵ", "ਆਫ਼ਲਾਈਨ", "ਮੁੜ ਜੁੜ ਰਿਹਾ ਹੈ", "ਪਲੇਟਫਾਰਮ ਕਾਰਜਸਥਾਨ", "ਐਡਮਿਨ ਕਾਰਜਸਥਾਨ", "ਸੰਸਥਾ ਕਾਰਜਸਥਾਨ", "ਡਰਾਈਵਰ ਅਤੇ ਯਾਤਰੀ", "ਡਰਾਈਵਰ ਅਰਜ਼ੀ", "ਯਾਤਰੀ ਕਾਰਜਸਥਾਨ", "ਨਿਸ਼ਕਿਰਿਆ", "ਪ੍ਰੋਫ਼ਾਈਲ", "ਈਮੇਲ ਤਸਦੀਕਸ਼ੁਦਾ", "ਈਮੇਲ ਬਕਾਇਆ", "ਸਾਈਨ-ਇਨ ਖਾਤਾ", "ਮੁੱਖ ਨੈਵੀਗੇਸ਼ਨ", "ਨੈਵੀਗੇਸ਼ਨ ਮੀਨੂ ਬੰਦ ਕਰੋ", "ਨਵੀਂ ਸੂਚਨਾ", "ਲਾਈਵ ਅੱਪਡੇਟ ਮੁੜ ਜੁੜ ਰਹੇ ਹਨ। ਤੁਹਾਡੀਆਂ ਤਬਦੀਲੀਆਂ ਸੁਰੱਖਿਅਤ API ਰਾਹੀਂ ਜਾਰੀ ਰਹਿਣਗੀਆਂ।"],
};
for (const [locale, values] of Object.entries(uiLabels)) {
  resources[locale].translation.common.ui.labels = Object.fromEntries(
    uiLabelKeys.map((key, index) => [key, values[index]])
  );
}

const uiPageAdditionKeys = [
  "rideTracking", "routeShared", "reportIssue", "reportReceived",
  "about", "contactOptions", "allBookings", "allUpdates",
];
const uiPageAdditions = {
  en: ["Ride tracking", "Your route, shared.", "Report a ride issue", "Report received", "About AVONEX", "Contact options", "All bookings →", "All updates →"],
  hi: ["राइड ट्रैकिंग", "आपका साझा मार्ग", "राइड की समस्या की रिपोर्ट करें", "रिपोर्ट प्राप्त हुई", "AVONEX के बारे में", "संपर्क विकल्प", "सभी बुकिंग →", "सभी अपडेट →"],
  bn: ["রাইড ট্র্যাকিং", "আপনার যৌথ যাত্রাপথ", "রাইডের সমস্যার রিপোর্ট করুন", "রিপোর্ট পাওয়া গেছে", "AVONEX সম্পর্কে", "যোগাযোগের বিকল্প", "সব বুকিং →", "সব আপডেট →"],
  mr: ["राइड ट्रॅकिंग", "तुमचा सामायिक मार्ग", "राइड समस्येची तक्रार करा", "तक्रार प्राप्त झाली", "AVONEX बद्दल", "संपर्क पर्याय", "सर्व बुकिंग →", "सर्व अपडेट →"],
  ta: ["பயணக் கண்காணிப்பு", "உங்கள் பகிர்ந்த பயணம்", "பயணச் சிக்கலைப் புகாரளி", "புகார் பெறப்பட்டது", "AVONEX பற்றி", "தொடர்பு விருப்பங்கள்", "அனைத்து முன்பதிவுகள் →", "அனைத்து புதுப்பிப்புகள் →"],
  te: ["రైడ్ ట్రాకింగ్", "మీ భాగస్వామ్య మార్గం", "రైడ్ సమస్యను నివేదించండి", "నివేదిక అందింది", "AVONEX గురించి", "సంప్రదింపు ఎంపికలు", "అన్ని బుకింగ్‌లు →", "అన్ని అప్‌డేట్‌లు →"],
  gu: ["રાઇડ ટ્રેકિંગ", "તમારો સહિયારો માર્ગ", "રાઇડની સમસ્યાની જાણ કરો", "રિપોર્ટ મળ્યો", "AVONEX વિશે", "સંપર્ક વિકલ્પો", "બધી બુકિંગ →", "બધા અપડેટ →"],
  kn: ["ರೈಡ್ ಟ್ರ್ಯಾಕಿಂಗ್", "ನಿಮ್ಮ ಹಂಚಿಕೊಂಡ ಮಾರ್ಗ", "ರೈಡ್ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ", "ವರದಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ", "AVONEX ಕುರಿತು", "ಸಂಪರ್ಕ ಆಯ್ಕೆಗಳು", "ಎಲ್ಲಾ ಬುಕಿಂಗ್‌ಗಳು →", "ಎಲ್ಲಾ ಅಪ್‌ಡೇಟ್‌ಗಳು →"],
  ml: ["യാത്രാ ട്രാക്കിംഗ്", "നിങ്ങളുടെ പങ്കിട്ട യാത്ര", "യാത്രാ പ്രശ്നം റിപ്പോർട്ട് ചെയ്യുക", "റിപ്പോർട്ട് ലഭിച്ചു", "AVONEX-നെക്കുറിച്ച്", "ബന്ധപ്പെടാനുള്ള മാർഗങ്ങൾ", "എല്ലാ ബുക്കിങ്ങുകളും →", "എല്ലാ അപ്‌ഡേറ്റുകളും →"],
  pa: ["ਰਾਈਡ ਟ੍ਰੈਕਿੰਗ", "ਤੁਹਾਡਾ ਸਾਂਝਾ ਰਸਤਾ", "ਰਾਈਡ ਦੀ ਸਮੱਸਿਆ ਦੀ ਰਿਪੋਰਟ ਕਰੋ", "ਰਿਪੋਰਟ ਮਿਲ ਗਈ", "AVONEX ਬਾਰੇ", "ਸੰਪਰਕ ਵਿਕਲਪ", "ਸਾਰੀਆਂ ਬੁਕਿੰਗਾਂ →", "ਸਾਰੇ ਅੱਪਡੇਟ →"],
};
for (const [locale, values] of Object.entries(uiPageAdditions)) {
  uiPageAdditionKeys.forEach((key, index) => {
    resources[locale].translation.common.ui.pages[key] = values[index];
  });
}

for (const locale of Object.keys(resources)) {
  const translation = resources[locale].translation;
  translation.passenger.pages = {
    dashboard: translation.common.ui.pages.passengerDashboard,
    rideSearch: translation.common.ui.pages.findRides,
    rideHistory: translation.common.ui.pages.rideHistory,
    liveTracking: translation.common.ui.pages.liveTracking,
  };
  translation.driver.pages = {
    dashboard: translation.common.ui.pages.driverDashboard,
    offerRide: translation.common.ui.pages.offerRide,
    bookingRequests: translation.common.ui.pages.bookingRequests,
    application: translation.common.ui.pages.driverApplication,
  };
  translation.organization.pages = {
    dashboard: translation.common.ui.pages.organizations,
  };
  translation.admin.pages = {
    dashboard: translation.common.nav.adminDashboard,
    reviewCenter: translation.common.ui.pages.reviewCenter,
    userManagement: translation.common.nav.userManagement,
    organizations: translation.common.nav.organizations,
  };
  translation.notifications.actions = {
    markAllRead: translation.common.ui.actions.markAllRead,
  };
}

const footerKeys = [
  "home", "explore", "forUsers", "legalSupport", "passengerGuide", "driverGuide",
  "organizationContact", "privacyDraft", "ctaEyebrow", "ctaTitle", "ctaDescription",
  "getStarted", "tagline", "brandDescription", "allRightsReserved", "backToTop",
];
const footerText = {
  en: ["Home", "Explore", "For users", "Legal & support", "Passenger guide", "Driver guide", "Organization contact options", "Privacy policy (draft)", "SHARED JOURNEYS START HERE", "Make Every Journey Smarter.", "Join AVONEX and discover a smarter way to share your everyday journeys.", "Get started", "Your Journey, Shared.", "AVONEX connects verified passengers and drivers to make everyday travel smarter, safer and more convenient.", "All rights reserved.", "Back to top"],
  hi: ["होम", "देखें", "उपयोगकर्ताओं के लिए", "कानूनी और सहायता", "यात्री मार्गदर्शिका", "ड्राइवर मार्गदर्शिका", "संस्थान संपर्क विकल्प", "गोपनीयता नीति (मसौदा)", "साझा यात्राएँ यहाँ से शुरू होती हैं", "हर यात्रा को बेहतर बनाएँ।", "AVONEX से जुड़ें और रोज़मर्रा की यात्राएँ साझा करने का बेहतर तरीका खोजें।", "शुरू करें", "आपकी यात्रा, साझा।", "AVONEX सत्यापित यात्रियों और ड्राइवरों को जोड़कर रोज़मर्रा का सफ़र बेहतर, सुरक्षित और सुविधाजनक बनाता है।", "सर्वाधिकार सुरक्षित।", "ऊपर जाएँ"],
  bn: ["হোম", "ঘুরে দেখুন", "ব্যবহারকারীদের জন্য", "আইনি ও সহায়তা", "যাত্রীর নির্দেশিকা", "চালকের নির্দেশিকা", "প্রতিষ্ঠানের যোগাযোগের বিকল্প", "গোপনীয়তা নীতি (খসড়া)", "যৌথ যাত্রা শুরু হোক এখানে", "প্রতিটি যাত্রাকে আরও বুদ্ধিমান করুন।", "AVONEX-এ যোগ দিন এবং প্রতিদিনের যাত্রা ভাগ করে নেওয়ার ভালো উপায় খুঁজুন।", "শুরু করুন", "আপনার যাত্রা, সবার সঙ্গে।", "AVONEX যাচাইকৃত যাত্রী ও চালকদের যুক্ত করে প্রতিদিনের যাত্রাকে আরও নিরাপদ ও সুবিধাজনক করে।", "সর্বস্বত্ব সংরক্ষিত।", "উপরে যান"],
  mr: ["मुख्यपृष्ठ", "पाहा", "वापरकर्त्यांसाठी", "कायदेशीर आणि सहाय्य", "प्रवासी मार्गदर्शक", "चालक मार्गदर्शक", "संस्था संपर्क पर्याय", "गोपनीयता धोरण (मसुदा)", "सामायिक प्रवासाची सुरुवात येथे", "प्रत्येक प्रवास अधिक स्मार्ट करा.", "AVONEX मध्ये सामील व्हा आणि रोजचा प्रवास सामायिक करण्याचा उत्तम मार्ग शोधा.", "सुरू करा", "तुमचा प्रवास, सामायिक.", "AVONEX सत्यापित प्रवासी आणि चालकांना जोडून रोजचा प्रवास अधिक सुरक्षित आणि सोयीस्कर करतो.", "सर्व हक्क राखीव.", "वर जा"],
  ta: ["முகப்பு", "ஆராய்க", "பயனர்களுக்கு", "சட்டம் மற்றும் உதவி", "பயணி வழிகாட்டி", "ஓட்டுநர் வழிகாட்டி", "நிறுவனத் தொடர்பு விருப்பங்கள்", "தனியுரிமைக் கொள்கை (வரைவு)", "பகிர்ந்த பயணங்கள் இங்கே தொடங்குகின்றன", "ஒவ்வொரு பயணத்தையும் சிறப்பாக்குங்கள்.", "AVONEX-இல் இணைந்து அன்றாடப் பயணங்களைப் பகிர சிறந்த வழியைக் கண்டறியுங்கள்.", "தொடங்குங்கள்", "உங்கள் பயணம், பகிரப்பட்டது.", "சரிபார்க்கப்பட்ட பயணிகளையும் ஓட்டுநர்களையும் இணைத்து அன்றாடப் பயணத்தை பாதுகாப்பாகவும் வசதியாகவும் AVONEX மாற்றுகிறது.", "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.", "மேலே செல்"],
  te: ["హోమ్", "అన్వేషించండి", "వినియోగదారుల కోసం", "చట్టపరమైన మరియు సహాయం", "ప్రయాణికుడి మార్గదర్శి", "డ్రైవర్ మార్గదర్శి", "సంస్థ సంప్రదింపు ఎంపికలు", "గోప్యతా విధానం (ముసాయిదా)", "భాగస్వామ్య ప్రయాణాలు ఇక్కడ ప్రారంభం", "ప్రతి ప్రయాణాన్ని మెరుగుపరచండి.", "AVONEXలో చేరి రోజువారీ ప్రయాణాలను పంచుకునే మెరుగైన మార్గాన్ని కనుగొనండి.", "ప్రారంభించండి", "మీ ప్రయాణం, భాగస్వామ్యం.", "ధృవీకరించిన ప్రయాణికులు, డ్రైవర్లను కలిపి రోజువారీ ప్రయాణాన్ని సురక్షితంగా, సౌకర్యవంతంగా AVONEX చేస్తుంది.", "అన్ని హక్కులు ప్రత్యేకించబడ్డాయి.", "పైకి వెళ్ళండి"],
  gu: ["હોમ", "અન્વેષણ કરો", "વપરાશકર્તાઓ માટે", "કાનૂની અને સહાય", "પ્રવાસી માર્ગદર્શિકા", "ડ્રાઇવર માર્ગદર્શિકા", "સંસ્થાના સંપર્ક વિકલ્પો", "ગોપનીયતા નીતિ (ડ્રાફ્ટ)", "સહિયારી મુસાફરી અહીંથી શરૂ થાય છે", "દરેક મુસાફરીને વધુ સ્માર્ટ બનાવો.", "AVONEX સાથે જોડાઓ અને રોજિંદી મુસાફરી વહેંચવાની વધુ સારી રીત શોધો.", "શરૂ કરો", "તમારી મુસાફરી, સહિયારી.", "AVONEX ચકાસેલા પ્રવાસીઓ અને ડ્રાઇવરોને જોડીને રોજની મુસાફરી વધુ સુરક્ષિત અને અનુકૂળ બનાવે છે.", "બધા હકો સુરક્ષિત.", "ટોચ પર પાછા"],
  kn: ["ಮುಖಪುಟ", "ಅನ್ವೇಷಿಸಿ", "ಬಳಕೆದಾರರಿಗಾಗಿ", "ಕಾನೂನು ಮತ್ತು ಬೆಂಬಲ", "ಪ್ರಯಾಣಿಕರ ಮಾರ್ಗದರ್ಶಿ", "ಚಾಲಕರ ಮಾರ್ಗದರ್ಶಿ", "ಸಂಸ್ಥೆಯ ಸಂಪರ್ಕ ಆಯ್ಕೆಗಳು", "ಗೌಪ್ಯತಾ ನೀತಿ (ಕರಡು)", "ಹಂಚಿಕೊಂಡ ಪ್ರಯಾಣಗಳು ಇಲ್ಲಿ ಆರಂಭವಾಗುತ್ತವೆ", "ಪ್ರತಿ ಪ್ರಯಾಣವನ್ನು ಉತ್ತಮಗೊಳಿಸಿ.", "AVONEX ಸೇರಿ ದೈನಂದಿನ ಪ್ರಯಾಣ ಹಂಚಿಕೊಳ್ಳುವ ಉತ್ತಮ ಮಾರ್ಗ ಕಂಡುಕೊಳ್ಳಿ.", "ಪ್ರಾರಂಭಿಸಿ", "ನಿಮ್ಮ ಪ್ರಯಾಣ, ಹಂಚಿಕೆ.", "ಪರಿಶೀಲಿಸಿದ ಪ್ರಯಾಣಿಕರು ಮತ್ತು ಚಾಲಕರನ್ನು ಸಂಪರ್ಕಿಸಿ ದೈನಂದಿನ ಪ್ರಯಾಣವನ್ನು ಸುರಕ್ಷಿತ ಹಾಗೂ ಅನುಕೂಲಕರವಾಗಿಸಲು AVONEX ಸಹಾಯ ಮಾಡುತ್ತದೆ.", "ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.", "ಮೇಲಕ್ಕೆ ಹಿಂತಿರುಗಿ"],
  ml: ["ഹോം", "പര്യവേക്ഷണം", "ഉപയോക്താക്കൾക്കായി", "നിയമവും പിന്തുണയും", "യാത്രക്കാരുടെ ഗൈഡ്", "ഡ്രൈവർ ഗൈഡ്", "സ്ഥാപന ബന്ധപ്പെടൽ മാർഗങ്ങൾ", "സ്വകാര്യതാ നയം (കരട്)", "പങ്കിട്ട യാത്രകൾ ഇവിടെ തുടങ്ങുന്നു", "ഓരോ യാത്രയും മികച്ചതാക്കൂ.", "AVONEX-ൽ ചേരൂ; ദൈനംദിന യാത്രകൾ പങ്കിടാനുള്ള മികച്ച മാർഗം കണ്ടെത്തൂ.", "തുടങ്ങുക", "നിങ്ങളുടെ യാത്ര, പങ്കിട്ടത്.", "പരിശോധിച്ച യാത്രക്കാരെയും ഡ്രൈവർമാരെയും ബന്ധിപ്പിച്ച് ദൈനംദിന യാത്ര സുരക്ഷിതവും സൗകര്യപ്രദവുമാക്കുന്നു AVONEX.", "എല്ലാ അവകാശങ്ങളും സംരക്ഷിച്ചിരിക്കുന്നു.", "മുകളിലേക്ക് മടങ്ങുക"],
  pa: ["ਮੁੱਖ ਪੰਨਾ", "ਵੇਖੋ", "ਵਰਤੋਂਕਾਰਾਂ ਲਈ", "ਕਾਨੂੰਨੀ ਅਤੇ ਸਹਾਇਤਾ", "ਯਾਤਰੀ ਗਾਈਡ", "ਡਰਾਈਵਰ ਗਾਈਡ", "ਸੰਸਥਾ ਸੰਪਰਕ ਵਿਕਲਪ", "ਪਰਦੇਦਾਰੀ ਨੀਤੀ (ਖਰੜਾ)", "ਸਾਂਝੀਆਂ ਯਾਤਰਾਵਾਂ ਇੱਥੋਂ ਸ਼ੁਰੂ ਹੁੰਦੀਆਂ ਹਨ", "ਹਰ ਯਾਤਰਾ ਨੂੰ ਹੋਰ ਸੁਚੱਜਾ ਬਣਾਓ।", "AVONEX ਨਾਲ ਜੁੜੋ ਅਤੇ ਰੋਜ਼ਾਨਾ ਯਾਤਰਾ ਸਾਂਝੀ ਕਰਨ ਦਾ ਵਧੀਆ ਤਰੀਕਾ ਲੱਭੋ।", "ਸ਼ੁਰੂ ਕਰੋ", "ਤੁਹਾਡੀ ਯਾਤਰਾ, ਸਾਂਝੀ।", "AVONEX ਤਸਦੀਕਸ਼ੁਦਾ ਯਾਤਰੀਆਂ ਅਤੇ ਡਰਾਈਵਰਾਂ ਨੂੰ ਜੋੜ ਕੇ ਰੋਜ਼ਾਨਾ ਸਫ਼ਰ ਨੂੰ ਸੁਰੱਖਿਅਤ ਤੇ ਸੁਖਾਲਾ ਬਣਾਉਂਦਾ ਹੈ।", "ਸਾਰੇ ਹੱਕ ਰਾਖਵੇਂ ਹਨ।", "ਉੱਪਰ ਵਾਪਸ ਜਾਓ"],
};
for (const [locale, values] of Object.entries(footerText)) {
  resources[locale].translation.common.ui.footer = Object.fromEntries(
    footerKeys.map((key, index) => [key, values[index]])
  );
}

const uiEmptyKeys = [
  "noBookingsFound", "noBookingsYet", "noNotificationsYet", "noNotificationsFound",
  "noReviewsYet", "noDriverReviews", "driverProfileUnavailable", "noBookingRequests",
  "organizationDetailsUnavailable", "noTrendData", "noUsersFound", "noOrganizationsFound",
  "noRidesInScope", "noBookingsInScope", "noReportsInScope", "noReviewsInScope",
  "noOrganizationActivity", "noAuditEvents",
];
const uiEmptyText = {
  en: ["No bookings found", "No bookings yet", "No notifications yet", "No notifications found", "No reviews yet", "No driver reviews yet", "Driver profile unavailable", "No active booking requests", "Organization details are unavailable", "No trend data available", "No users found", "No organizations found", "No rides in scope", "No bookings in scope", "No reports in scope", "No reviews in scope", "No organization activity", "No audit events yet"],
  hi: ["कोई बुकिंग नहीं मिली", "अभी कोई बुकिंग नहीं", "अभी कोई सूचना नहीं", "कोई सूचना नहीं मिली", "अभी कोई समीक्षा नहीं", "अभी ड्राइवर की कोई समीक्षा नहीं", "ड्राइवर प्रोफ़ाइल उपलब्ध नहीं", "कोई सक्रिय बुकिंग अनुरोध नहीं", "संस्थान का विवरण उपलब्ध नहीं", "रुझान डेटा उपलब्ध नहीं", "कोई उपयोगकर्ता नहीं मिला", "कोई संस्थान नहीं मिला", "दायरे में कोई राइड नहीं", "दायरे में कोई बुकिंग नहीं", "दायरे में कोई रिपोर्ट नहीं", "दायरे में कोई समीक्षा नहीं", "संस्थान की कोई गतिविधि नहीं", "अभी कोई ऑडिट इवेंट नहीं"],
  bn: ["কোনো বুকিং পাওয়া যায়নি", "এখনও কোনো বুকিং নেই", "এখনও কোনো বিজ্ঞপ্তি নেই", "কোনো বিজ্ঞপ্তি পাওয়া যায়নি", "এখনও কোনো পর্যালোচনা নেই", "চালকের কোনো পর্যালোচনা নেই", "চালকের প্রোফাইল পাওয়া যাচ্ছে না", "কোনো সক্রিয় বুকিং অনুরোধ নেই", "প্রতিষ্ঠানের বিবরণ পাওয়া যাচ্ছে না", "প্রবণতার তথ্য নেই", "কোনো ব্যবহারকারী পাওয়া যায়নি", "কোনো প্রতিষ্ঠান পাওয়া যায়নি", "এই সীমায় কোনো রাইড নেই", "এই সীমায় কোনো বুকিং নেই", "এই সীমায় কোনো রিপোর্ট নেই", "এই সীমায় কোনো পর্যালোচনা নেই", "প্রতিষ্ঠানের কোনো কার্যকলাপ নেই", "এখনও কোনো অডিট ইভেন্ট নেই"],
  mr: ["बुकिंग सापडली नाही", "अद्याप बुकिंग नाही", "अद्याप सूचना नाहीत", "सूचना सापडल्या नाहीत", "अद्याप अभिप्राय नाही", "चालकाचे अभिप्राय अद्याप नाहीत", "चालक प्रोफाइल उपलब्ध नाही", "सक्रिय बुकिंग विनंत्या नाहीत", "संस्थेचा तपशील उपलब्ध नाही", "कल डेटा उपलब्ध नाही", "वापरकर्ते सापडले नाहीत", "संस्था सापडल्या नाहीत", "या व्याप्तीत राइड नाहीत", "या व्याप्तीत बुकिंग नाहीत", "या व्याप्तीत अहवाल नाहीत", "या व्याप्तीत अभिप्राय नाहीत", "संस्थेची गतिविधी नाही", "अद्याप ऑडिट घटना नाहीत"],
  ta: ["முன்பதிவுகள் இல்லை", "முன்பதிவுகள் இன்னும் இல்லை", "அறிவிப்புகள் இன்னும் இல்லை", "அறிவிப்புகள் இல்லை", "விமர்சனங்கள் இன்னும் இல்லை", "ஓட்டுநர் விமர்சனங்கள் இல்லை", "ஓட்டுநர் சுயவிவரம் கிடைக்கவில்லை", "செயலில் உள்ள முன்பதிவு கோரிக்கைகள் இல்லை", "நிறுவன விவரங்கள் கிடைக்கவில்லை", "போக்கு தரவு இல்லை", "பயனர்கள் இல்லை", "நிறுவனங்கள் இல்லை", "இந்த வரம்பில் பயணங்கள் இல்லை", "இந்த வரம்பில் முன்பதிவுகள் இல்லை", "இந்த வரம்பில் புகார்கள் இல்லை", "இந்த வரம்பில் விமர்சனங்கள் இல்லை", "நிறுவனச் செயல்பாடு இல்லை", "தணிக்கை நிகழ்வுகள் இன்னும் இல்லை"],
  te: ["బుకింగ్‌లు కనబడలేదు", "ఇంకా బుకింగ్‌లు లేవు", "ఇంకా నోటిఫికేషన్‌లు లేవు", "నోటిఫికేషన్‌లు కనబడలేదు", "ఇంకా సమీక్షలు లేవు", "డ్రైవర్ సమీక్షలు ఇంకా లేవు", "డ్రైవర్ ప్రొఫైల్ అందుబాటులో లేదు", "క్రియాశీల బుకింగ్ అభ్యర్థనలు లేవు", "సంస్థ వివరాలు అందుబాటులో లేవు", "ట్రెండ్ డేటా అందుబాటులో లేదు", "వినియోగదారులు కనబడలేదు", "సంస్థలు కనబడలేదు", "ఈ పరిధిలో రైడ్‌లు లేవు", "ఈ పరిధిలో బుకింగ్‌లు లేవు", "ఈ పరిధిలో నివేదికలు లేవు", "ఈ పరిధిలో సమీక్షలు లేవు", "సంస్థ కార్యకలాపాలు లేవు", "ఇంకా ఆడిట్ ఈవెంట్‌లు లేవు"],
  gu: ["કોઈ બુકિંગ મળી નથી", "હજુ સુધી બુકિંગ નથી", "હજુ સૂચનાઓ નથી", "કોઈ સૂચના મળી નથી", "હજુ સમીક્ષાઓ નથી", "ડ્રાઇવરની સમીક્ષાઓ નથી", "ડ્રાઇવર પ્રોફાઇલ ઉપલબ્ધ નથી", "સક્રિય બુકિંગ વિનંતીઓ નથી", "સંસ્થાની વિગતો ઉપલબ્ધ નથી", "વલણનો ડેટા ઉપલબ્ધ નથી", "કોઈ વપરાશકર્તા મળ્યો નથી", "કોઈ સંસ્થા મળી નથી", "આ મર્યાદામાં રાઇડ નથી", "આ મર્યાદામાં બુકિંગ નથી", "આ મર્યાદામાં રિપોર્ટ નથી", "આ મર્યાદામાં સમીક્ષા નથી", "સંસ્થાની પ્રવૃત્તિ નથી", "હજુ ઑડિટ ઇવેન્ટ નથી"],
  kn: ["ಯಾವುದೇ ಬುಕಿಂಗ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ", "ಇನ್ನೂ ಬುಕಿಂಗ್‌ಗಳಿಲ್ಲ", "ಇನ್ನೂ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ", "ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ", "ಇನ್ನೂ ವಿಮರ್ಶೆಗಳಿಲ್ಲ", "ಚಾಲಕರ ವಿಮರ್ಶೆಗಳಿಲ್ಲ", "ಚಾಲಕರ ಪ್ರೊಫೈಲ್ ಲಭ್ಯವಿಲ್ಲ", "ಸಕ್ರಿಯ ಬುಕಿಂಗ್ ವಿನಂತಿಗಳಿಲ್ಲ", "ಸಂಸ್ಥೆಯ ವಿವರಗಳು ಲಭ್ಯವಿಲ್ಲ", "ಪ್ರವೃತ್ತಿ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ", "ಯಾವುದೇ ಬಳಕೆದಾರರು ಕಂಡುಬಂದಿಲ್ಲ", "ಯಾವುದೇ ಸಂಸ್ಥೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ", "ಈ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ರೈಡ್‌ಗಳಿಲ್ಲ", "ಈ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಬುಕಿಂಗ್‌ಗಳಿಲ್ಲ", "ಈ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ವರದಿಗಳಿಲ್ಲ", "ಈ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ವಿಮರ್ಶೆಗಳಿಲ್ಲ", "ಸಂಸ್ಥೆಯ ಚಟುವಟಿಕೆಗಳಿಲ್ಲ", "ಇನ್ನೂ ಆಡಿಟ್ ಘಟನೆಗಳಿಲ್ಲ"],
  ml: ["ബുക്കിങ്ങുകളൊന്നും കണ്ടെത്തിയില്ല", "ഇതുവരെ ബുക്കിങ്ങുകളില്ല", "അറിയിപ്പുകളൊന്നുമില്ല", "അറിയിപ്പുകളൊന്നും കണ്ടെത്തിയില്ല", "അവലോകനങ്ങളില്ല", "ഡ്രൈവർ അവലോകനങ്ങളില്ല", "ഡ്രൈവർ പ്രൊഫൈൽ ലഭ്യമല്ല", "സജീവ ബുക്കിങ് അഭ്യർത്ഥനകളില്ല", "സ്ഥാപന വിവരങ്ങൾ ലഭ്യമല്ല", "ട്രെൻഡ് ഡാറ്റ ലഭ്യമല്ല", "ഉപയോക്താക്കളെ കണ്ടെത്തിയില്ല", "സ്ഥാപനങ്ങളെ കണ്ടെത്തിയില്ല", "ഈ പരിധിയിൽ യാത്രകളില്ല", "ഈ പരിധിയിൽ ബുക്കിങ്ങുകളില്ല", "ഈ പരിധിയിൽ റിപ്പോർട്ടുകളില്ല", "ഈ പരിധിയിൽ അവലോകനങ്ങളില്ല", "സ്ഥാപന പ്രവർത്തനങ്ങളില്ല", "ഓഡിറ്റ് ഇവന്റുകളില്ല"],
  pa: ["ਕੋਈ ਬੁਕਿੰਗ ਨਹੀਂ ਮਿਲੀ", "ਹਾਲੇ ਕੋਈ ਬੁਕਿੰਗ ਨਹੀਂ", "ਹਾਲੇ ਕੋਈ ਸੂਚਨਾ ਨਹੀਂ", "ਕੋਈ ਸੂਚਨਾ ਨਹੀਂ ਮਿਲੀ", "ਹਾਲੇ ਕੋਈ ਸਮੀਖਿਆ ਨਹੀਂ", "ਡਰਾਈਵਰ ਦੀ ਕੋਈ ਸਮੀਖਿਆ ਨਹੀਂ", "ਡਰਾਈਵਰ ਪ੍ਰੋਫ਼ਾਈਲ ਉਪਲਬਧ ਨਹੀਂ", "ਕੋਈ ਸਰਗਰਮ ਬੁਕਿੰਗ ਬੇਨਤੀ ਨਹੀਂ", "ਸੰਸਥਾ ਦੇ ਵੇਰਵੇ ਉਪਲਬਧ ਨਹੀਂ", "ਰੁਝਾਨ ਡਾਟਾ ਉਪਲਬਧ ਨਹੀਂ", "ਕੋਈ ਵਰਤੋਂਕਾਰ ਨਹੀਂ ਮਿਲਿਆ", "ਕੋਈ ਸੰਸਥਾ ਨਹੀਂ ਮਿਲੀ", "ਇਸ ਘੇਰੇ ਵਿੱਚ ਕੋਈ ਰਾਈਡ ਨਹੀਂ", "ਇਸ ਘੇਰੇ ਵਿੱਚ ਕੋਈ ਬੁਕਿੰਗ ਨਹੀਂ", "ਇਸ ਘੇਰੇ ਵਿੱਚ ਕੋਈ ਰਿਪੋਰਟ ਨਹੀਂ", "ਇਸ ਘੇਰੇ ਵਿੱਚ ਕੋਈ ਸਮੀਖਿਆ ਨਹੀਂ", "ਸੰਸਥਾ ਦੀ ਕੋਈ ਸਰਗਰਮੀ ਨਹੀਂ", "ਹਾਲੇ ਕੋਈ ਆਡਿਟ ਘਟਨਾ ਨਹੀਂ"],
};
for (const [locale, values] of Object.entries(uiEmptyText)) {
  resources[locale].translation.common.ui.empty = Object.fromEntries(
    uiEmptyKeys.map((key, index) => [key, values[index]])
  );
}

const uiEyebrowKeys = [
  "travelActivity", "driverTools", "liveTracking", "passengerTools", "communityTrust",
  "driverProfile", "authorizedAdministration", "yourUpdates", "rideMatching",
  "rideDetails", "driverCommunity", "security", "account", "community", "privacy",
  "contact", "accountControl", "helpCenter",
];
const uiEyebrows = {
  en: ["TRAVEL ACTIVITY", "DRIVER TOOLS", "LIVE TRACKING", "PASSENGER TOOLS", "COMMUNITY TRUST", "DRIVER PROFILE", "AUTHORIZED ADMINISTRATION", "YOUR UPDATES", "RIDE MATCHING", "RIDE DETAILS", "DRIVER COMMUNITY", "SECURITY", "ACCOUNT", "COMMUNITY", "PRIVACY", "CONTACT", "ACCOUNT CONTROL", "HELP CENTER"],
  hi: ["यात्रा गतिविधि", "ड्राइवर टूल", "लाइव ट्रैकिंग", "यात्री टूल", "समुदाय का भरोसा", "ड्राइवर प्रोफ़ाइल", "अधिकृत प्रशासन", "आपके अपडेट", "राइड खोज", "राइड विवरण", "ड्राइवर समुदाय", "सुरक्षा", "खाता", "समुदाय", "गोपनीयता", "संपर्क", "खाता नियंत्रण", "सहायता केंद्र"],
  bn: ["যাত্রার কার্যকলাপ", "চালকের টুল", "লাইভ ট্র্যাকিং", "যাত্রীর টুল", "কমিউনিটির আস্থা", "চালকের প্রোফাইল", "অনুমোদিত প্রশাসন", "আপনার আপডেট", "রাইড খোঁজা", "রাইডের বিবরণ", "চালক কমিউনিটি", "নিরাপত্তা", "অ্যাকাউন্ট", "কমিউনিটি", "গোপনীয়তা", "যোগাযোগ", "অ্যাকাউন্ট নিয়ন্ত্রণ", "সহায়তা কেন্দ্র"],
  mr: ["प्रवास क्रियाकलाप", "चालक साधने", "थेट ट्रॅकिंग", "प्रवासी साधने", "समुदायाचा विश्वास", "चालक प्रोफाइल", "अधिकृत प्रशासन", "तुमचे अपडेट", "राइड शोध", "राइड तपशील", "चालक समुदाय", "सुरक्षा", "खाते", "समुदाय", "गोपनीयता", "संपर्क", "खाते नियंत्रण", "मदत केंद्र"],
  ta: ["பயணச் செயல்பாடு", "ஓட்டுநர் கருவிகள்", "நேரலை கண்காணிப்பு", "பயணி கருவிகள்", "சமூக நம்பிக்கை", "ஓட்டுநர் சுயவிவரம்", "அங்கீகரிக்கப்பட்ட நிர்வாகம்", "உங்கள் புதுப்பிப்புகள்", "பயணத் தேடல்", "பயண விவரங்கள்", "ஓட்டுநர் சமூகம்", "பாதுகாப்பு", "கணக்கு", "சமூகம்", "தனியுரிமை", "தொடர்பு", "கணக்குக் கட்டுப்பாடு", "உதவி மையம்"],
  te: ["ప్రయాణ కార్యకలాపాలు", "డ్రైవర్ సాధనాలు", "లైవ్ ట్రాకింగ్", "ప్రయాణికుడి సాధనాలు", "సంఘం నమ్మకం", "డ్రైవర్ ప్రొఫైల్", "అధీకృత పరిపాలన", "మీ అప్‌డేట్‌లు", "రైడ్ సరిపోలిక", "రైడ్ వివరాలు", "డ్రైవర్ సంఘం", "భద్రత", "ఖాతా", "సంఘం", "గోప్యత", "సంప్రదింపు", "ఖాతా నియంత్రణ", "సహాయ కేంద్రం"],
  gu: ["મુસાફરી પ્રવૃત્તિ", "ડ્રાઇવર સાધનો", "લાઇવ ટ્રેકિંગ", "પ્રવાસી સાધનો", "સમુદાયનો વિશ્વાસ", "ડ્રાઇવર પ્રોફાઇલ", "અધિકૃત વહીવટ", "તમારા અપડેટ", "રાઇડ શોધ", "રાઇડ વિગતો", "ડ્રાઇવર સમુદાય", "સુરક્ષા", "ખાતું", "સમુદાય", "ગોપનીયતા", "સંપર્ક", "ખાતા નિયંત્રણ", "મદદ કેન્દ્ર"],
  kn: ["ಪ್ರಯಾಣ ಚಟುವಟಿಕೆ", "ಚಾಲಕರ ಉಪಕರಣಗಳು", "ನೇರ ಟ್ರ್ಯಾಕಿಂಗ್", "ಪ್ರಯಾಣಿಕರ ಉಪಕರಣಗಳು", "ಸಮುದಾಯದ ವಿಶ್ವಾಸ", "ಚಾಲಕರ ಪ್ರೊಫೈಲ್", "ಅಧಿಕೃತ ಆಡಳಿತ", "ನಿಮ್ಮ ಅಪ್‌ಡೇಟ್‌ಗಳು", "ರೈಡ್ ಹುಡುಕಾಟ", "ರೈಡ್ ವಿವರಗಳು", "ಚಾಲಕರ ಸಮುದಾಯ", "ಭದ್ರತೆ", "ಖಾತೆ", "ಸಮುದಾಯ", "ಗೌಪ್ಯತೆ", "ಸಂಪರ್ಕ", "ಖಾತೆ ನಿಯಂತ್ರಣ", "ಸಹಾಯ ಕೇಂದ್ರ"],
  ml: ["യാത്രാ പ്രവർത്തനം", "ഡ്രൈവർ ടൂളുകൾ", "തത്സമയ ട്രാക്കിംഗ്", "യാത്രക്കാരുടെ ടൂളുകൾ", "സമൂഹത്തിന്റെ വിശ്വാസം", "ഡ്രൈവർ പ്രൊഫൈൽ", "അംഗീകൃത ഭരണം", "നിങ്ങളുടെ അപ്‌ഡേറ്റുകൾ", "യാത്രാ തിരയൽ", "യാത്രാ വിവരങ്ങൾ", "ഡ്രൈവർ സമൂഹം", "സുരക്ഷ", "അക്കൗണ്ട്", "സമൂഹം", "സ്വകാര്യത", "ബന്ധപ്പെടുക", "അക്കൗണ്ട് നിയന്ത്രണം", "സഹായ കേന്ദ്രം"],
  pa: ["ਯਾਤਰਾ ਸਰਗਰਮੀ", "ਡਰਾਈਵਰ ਟੂਲ", "ਲਾਈਵ ਟ੍ਰੈਕਿੰਗ", "ਯਾਤਰੀ ਟੂਲ", "ਭਾਈਚਾਰੇ ਦਾ ਭਰੋਸਾ", "ਡਰਾਈਵਰ ਪ੍ਰੋਫ਼ਾਈਲ", "ਅਧਿਕਾਰਤ ਪ੍ਰਸ਼ਾਸਨ", "ਤੁਹਾਡੇ ਅੱਪਡੇਟ", "ਰਾਈਡ ਖੋਜ", "ਰਾਈਡ ਵੇਰਵੇ", "ਡਰਾਈਵਰ ਭਾਈਚਾਰਾ", "ਸੁਰੱਖਿਆ", "ਖਾਤਾ", "ਭਾਈਚਾਰਾ", "ਪਰਦੇਦਾਰੀ", "ਸੰਪਰਕ", "ਖਾਤਾ ਨਿਯੰਤਰਣ", "ਮਦਦ ਕੇਂਦਰ"],
};
for (const [locale, values] of Object.entries(uiEyebrows)) {
  resources[locale].translation.common.ui.eyebrows = Object.fromEntries(
    uiEyebrowKeys.map((key, index) => [key, values[index]])
  );
}

const extendedFormLabelKeys = [
  "organizationName", "organizationType", "websiteOptional", "identityDocumentType",
  "vehicleType", "bookingStatus", "bookingDate", "issueCategory", "departureDate",
  "seatsNeeded", "maxPricePerSeat", "searchRadiusKm", "sortBy", "departureTime",
  "totalSeats", "pricePerSeat", "departureFrom", "departureThrough", "sortRides",
  "seats", "role", "identityStatus", "accountStatus", "status", "city", "state",
  "country", "userId", "rideId", "completedBookingId", "shortNameOptional",
  "lastFourCharactersOnly", "drivingLicenceNumber", "vehicleRegistrationNumber",
  "searchNameEmailPhone", "searchNameCityDomain",
];
const extendedFormLabels = {
  en: ["Organization name", "Organization type", "Website (optional)", "Identity document type", "Vehicle type", "Booking status", "Booking date", "Issue category", "Departure date", "Seats needed", "Max price / seat", "Search radius (km)", "Sort by", "Departure time", "Total seats", "Price per seat", "Departure from", "Departure through", "Sort rides", "Seats", "Role", "Identity status", "Account status", "Status", "City", "State", "Country", "User ID", "Ride ID", "Completed booking ID", "Short name (optional)", "Last four characters only", "Driving licence number", "Vehicle registration number", "Search name, email or phone", "Search name, city or domain"],
  hi: ["संस्थान का नाम", "संस्थान का प्रकार", "वेबसाइट (वैकल्पिक)", "पहचान दस्तावेज़ का प्रकार", "वाहन का प्रकार", "बुकिंग की स्थिति", "बुकिंग की तारीख", "समस्या की श्रेणी", "प्रस्थान की तारीख", "आवश्यक सीटें", "अधिकतम किराया / सीट", "खोज की दूरी (किमी)", "क्रमबद्ध करें", "प्रस्थान का समय", "कुल सीटें", "प्रति सीट किराया", "प्रस्थान स्थान", "गंतव्य तक", "राइड क्रमबद्ध करें", "सीटें", "भूमिका", "पहचान की स्थिति", "खाते की स्थिति", "स्थिति", "शहर", "राज्य", "देश", "उपयोगकर्ता आईडी", "राइड आईडी", "पूरी हुई बुकिंग आईडी", "संक्षिप्त नाम (वैकल्पिक)", "केवल अंतिम चार अक्षर", "ड्राइविंग लाइसेंस नंबर", "वाहन पंजीकरण नंबर", "नाम, ईमेल या फ़ोन खोजें", "नाम, शहर या डोमेन खोजें"],
  bn: ["প্রতিষ্ঠানের নাম", "প্রতিষ্ঠানের ধরন", "ওয়েবসাইট (ঐচ্ছিক)", "পরিচয়পত্রের ধরন", "গাড়ির ধরন", "বুকিংয়ের অবস্থা", "বুকিংয়ের তারিখ", "সমস্যার বিভাগ", "যাত্রার তারিখ", "প্রয়োজনীয় আসন", "প্রতি আসনের সর্বোচ্চ ভাড়া", "অনুসন্ধানের পরিসর (কিমি)", "সাজান", "যাত্রার সময়", "মোট আসন", "প্রতি আসনের ভাড়া", "যাত্রা শুরু", "যাত্রা শেষ", "রাইড সাজান", "আসন", "ভূমিকা", "পরিচয়ের অবস্থা", "অ্যাকাউন্টের অবস্থা", "অবস্থা", "শহর", "রাজ্য", "দেশ", "ব্যবহারকারীর আইডি", "রাইড আইডি", "সম্পন্ন বুকিং আইডি", "সংক্ষিপ্ত নাম (ঐচ্ছিক)", "শুধু শেষ চারটি অক্ষর", "ড্রাইভিং লাইসেন্স নম্বর", "গাড়ির নিবন্ধন নম্বর", "নাম, ইমেল বা ফোন খুঁজুন", "নাম, শহর বা ডোমেইন খুঁজুন"],
  mr: ["संस्थेचे नाव", "संस्थेचा प्रकार", "वेबसाइट (ऐच्छिक)", "ओळखपत्राचा प्रकार", "वाहनाचा प्रकार", "बुकिंग स्थिती", "बुकिंगची तारीख", "समस्येचा प्रकार", "प्रस्थानाची तारीख", "आवश्यक जागा", "कमाल भाडे / जागा", "शोध त्रिज्या (किमी)", "क्रमवारी लावा", "प्रस्थानाची वेळ", "एकूण जागा", "प्रति जागेचे भाडे", "प्रस्थानापासून", "येथपर्यंत", "राइड क्रमवारी", "जागा", "भूमिका", "ओळख स्थिती", "खाते स्थिती", "स्थिती", "शहर", "राज्य", "देश", "वापरकर्ता आयडी", "राइड आयडी", "पूर्ण बुकिंग आयडी", "लघुनाव (ऐच्छिक)", "फक्त शेवटची चार अक्षरे", "ड्रायव्हिंग लायसन्स क्रमांक", "वाहन नोंदणी क्रमांक", "नाव, ईमेल किंवा फोन शोधा", "नाव, शहर किंवा डोमेन शोधा"],
  ta: ["நிறுவனத்தின் பெயர்", "நிறுவன வகை", "இணையதளம் (விருப்பம்)", "அடையாள ஆவண வகை", "வாகன வகை", "முன்பதிவு நிலை", "முன்பதிவு தேதி", "சிக்கல் வகை", "புறப்படும் தேதி", "தேவையான இருக்கைகள்", "அதிகபட்ச கட்டணம் / இருக்கை", "தேடல் தூரம் (கிமீ)", "வரிசைப்படுத்து", "புறப்படும் நேரம்", "மொத்த இருக்கைகள்", "இருக்கைக்கான கட்டணம்", "புறப்படும் இடம்", "செல்லும் இடம் வரை", "பயணங்களை வரிசைப்படுத்து", "இருக்கைகள்", "பங்கு", "அடையாள நிலை", "கணக்கு நிலை", "நிலை", "நகரம்", "மாநிலம்", "நாடு", "பயனர் ஐடி", "பயண ஐடி", "முடிக்கப்பட்ட முன்பதிவு ஐடி", "சுருக்கப் பெயர் (விருப்பம்)", "கடைசி நான்கு எழுத்துகள் மட்டும்", "ஓட்டுநர் உரிம எண்", "வாகனப் பதிவு எண்", "பெயர், மின்னஞ்சல் அல்லது தொலைபேசியைத் தேடு", "பெயர், நகரம் அல்லது டொமைனைத் தேடு"],
  te: ["సంస్థ పేరు", "సంస్థ రకం", "వెబ్‌సైట్ (ఐచ్ఛికం)", "గుర్తింపు పత్రం రకం", "వాహన రకం", "బుకింగ్ స్థితి", "బుకింగ్ తేదీ", "సమస్య వర్గం", "ప్రయాణ తేదీ", "అవసరమైన సీట్లు", "గరిష్ఠ ధర / సీటు", "శోధన పరిధి (కి.మీ.)", "క్రమబద్ధీకరించండి", "ప్రయాణ సమయం", "మొత్తం సీట్లు", "సీటుకు ధర", "ప్రయాణం ప్రారంభం", "ప్రయాణం ముగింపు", "రైడ్‌లను క్రమబద్ధీకరించండి", "సీట్లు", "పాత్ర", "గుర్తింపు స్థితి", "ఖాతా స్థితి", "స్థితి", "నగరం", "రాష్ట్రం", "దేశం", "వినియోగదారు ID", "రైడ్ ID", "పూర్తయిన బుకింగ్ ID", "చిన్న పేరు (ఐచ్ఛికం)", "చివరి నాలుగు అక్షరాలు మాత్రమే", "డ్రైవింగ్ లైసెన్స్ నంబర్", "వాహన రిజిస్ట్రేషన్ నంబర్", "పేరు, ఇమెయిల్ లేదా ఫోన్ వెతకండి", "పేరు, నగరం లేదా డొమైన్ వెతకండి"],
  gu: ["સંસ્થાનું નામ", "સંસ્થાનો પ્રકાર", "વેબસાઇટ (વૈકલ્પિક)", "ઓળખ દસ્તાવેજનો પ્રકાર", "વાહનનો પ્રકાર", "બુકિંગની સ્થિતિ", "બુકિંગની તારીખ", "સમસ્યાનો પ્રકાર", "પ્રસ્થાનની તારીખ", "જરૂરી બેઠકો", "મહત્તમ ભાડું / બેઠક", "શોધ ત્રિજ્યા (કિમી)", "ક્રમમાં ગોઠવો", "પ્રસ્થાનનો સમય", "કુલ બેઠકો", "પ્રતિ બેઠક ભાડું", "અહીંથી પ્રસ્થાન", "અહીં સુધી", "રાઇડ ગોઠવો", "બેઠકો", "ભૂમિકા", "ઓળખની સ્થિતિ", "ખાતાની સ્થિતિ", "સ્થિતિ", "શહેર", "રાજ્ય", "દેશ", "વપરાશકર્તા ID", "રાઇડ ID", "પૂર્ણ થયેલ બુકિંગ ID", "ટૂંકું નામ (વૈકલ્પિક)", "છેલ્લા ચાર અક્ષરો જ", "ડ્રાઇવિંગ લાઇસન્સ નંબર", "વાહન નોંધણી નંબર", "નામ, ઈમેલ અથવા ફોન શોધો", "નામ, શહેર અથવા ડોમેન શોધો"],
  kn: ["ಸಂಸ್ಥೆಯ ಹೆಸರು", "ಸಂಸ್ಥೆಯ ಪ್ರಕಾರ", "ವೆಬ್‌ಸೈಟ್ (ಐಚ್ಛಿಕ)", "ಗುರುತಿನ ದಾಖಲೆ ಪ್ರಕಾರ", "ವಾಹನದ ಪ್ರಕಾರ", "ಬುಕಿಂಗ್ ಸ್ಥಿತಿ", "ಬುಕಿಂಗ್ ದಿನಾಂಕ", "ಸಮಸ್ಯೆಯ ವರ್ಗ", "ನಿರ್ಗಮನ ದಿನಾಂಕ", "ಬೇಕಾದ ಆಸನಗಳು", "ಗರಿಷ್ಠ ದರ / ಆಸನ", "ಹುಡುಕಾಟದ ಅಂತರ (ಕಿಮೀ)", "ವಿಂಗಡಿಸಿ", "ನಿರ್ಗಮನ ಸಮಯ", "ಒಟ್ಟು ಆಸನಗಳು", "ಪ್ರತಿ ಆಸನದ ದರ", "ಇಲ್ಲಿಂದ ನಿರ್ಗಮನ", "ಇಲ್ಲಿಯವರೆಗೆ", "ರೈಡ್‌ಗಳನ್ನು ವಿಂಗಡಿಸಿ", "ಆಸನಗಳು", "ಪಾತ್ರ", "ಗುರುತಿನ ಸ್ಥಿತಿ", "ಖಾತೆಯ ಸ್ಥಿತಿ", "ಸ್ಥಿತಿ", "ನಗರ", "ರಾಜ್ಯ", "ದೇಶ", "ಬಳಕೆದಾರ ID", "ರೈಡ್ ID", "ಪೂರ್ಣಗೊಂಡ ಬುಕಿಂಗ್ ID", "ಚಿಕ್ಕ ಹೆಸರು (ಐಚ್ಛಿಕ)", "ಕೊನೆಯ ನಾಲ್ಕು ಅಕ್ಷರಗಳು ಮಾತ್ರ", "ಚಾಲನಾ ಪರವಾನಗಿ ಸಂಖ್ಯೆ", "ವಾಹನ ನೋಂದಣಿ ಸಂಖ್ಯೆ", "ಹೆಸರು, ಇಮೇಲ್ ಅಥವಾ ಫೋನ್ ಹುಡುಕಿ", "ಹೆಸರು, ನಗರ ಅಥವಾ ಡೊಮೇನ್ ಹುಡುಕಿ"],
  ml: ["സ്ഥാപനത്തിന്റെ പേര്", "സ്ഥാപനത്തിന്റെ തരം", "വെബ്സൈറ്റ് (ഐച്ഛികം)", "തിരിച്ചറിയൽ രേഖയുടെ തരം", "വാഹനത്തിന്റെ തരം", "ബുക്കിങ് നില", "ബുക്കിങ് തീയതി", "പ്രശ്ന വിഭാഗം", "പുറപ്പെടുന്ന തീയതി", "ആവശ്യമായ സീറ്റുകൾ", "പരമാവധി നിരക്ക് / സീറ്റ്", "തിരയൽ പരിധി (കിമീ)", "ക്രമീകരിക്കുക", "പുറപ്പെടുന്ന സമയം", "ആകെ സീറ്റുകൾ", "സീറ്റിന് നിരക്ക്", "ഇവിടെ നിന്ന് പുറപ്പെടുക", "ഇവിടെ വരെ", "യാത്രകൾ ക്രമീകരിക്കുക", "സീറ്റുകൾ", "റോൾ", "തിരിച്ചറിയൽ നില", "അക്കൗണ്ട് നില", "നില", "നഗരം", "സംസ്ഥാനം", "രാജ്യം", "ഉപയോക്തൃ ഐഡി", "യാത്രാ ഐഡി", "പൂർത്തിയായ ബുക്കിങ് ഐഡി", "ചുരുക്കപ്പേര് (ഐച്ഛികം)", "അവസാന നാല് അക്ഷരങ്ങൾ മാത്രം", "ഡ്രൈവിങ് ലൈസൻസ് നമ്പർ", "വാഹന രജിസ്ട്രേഷൻ നമ്പർ", "പേര്, ഇമെയിൽ അല്ലെങ്കിൽ ഫോൺ തിരയുക", "പേര്, നഗരം അല്ലെങ്കിൽ ഡൊമെയ്ൻ തിരയുക"],
  pa: ["ਸੰਸਥਾ ਦਾ ਨਾਮ", "ਸੰਸਥਾ ਦੀ ਕਿਸਮ", "ਵੈੱਬਸਾਈਟ (ਵਿਕਲਪਿਕ)", "ਪਛਾਣ ਦਸਤਾਵੇਜ਼ ਦੀ ਕਿਸਮ", "ਵਾਹਨ ਦੀ ਕਿਸਮ", "ਬੁਕਿੰਗ ਦੀ ਸਥਿਤੀ", "ਬੁਕਿੰਗ ਦੀ ਤਾਰੀਖ", "ਮਸਲੇ ਦੀ ਸ਼੍ਰੇਣੀ", "ਰਵਾਨਗੀ ਦੀ ਤਾਰੀਖ", "ਲੋੜੀਂਦੀਆਂ ਸੀਟਾਂ", "ਵੱਧ ਤੋਂ ਵੱਧ ਕਿਰਾਇਆ / ਸੀਟ", "ਖੋਜ ਦਾ ਘੇਰਾ (ਕਿਮੀ)", "ਤਰਤੀਬ ਦਿਓ", "ਰਵਾਨਗੀ ਦਾ ਸਮਾਂ", "ਕੁੱਲ ਸੀਟਾਂ", "ਪ੍ਰਤੀ ਸੀਟ ਕਿਰਾਇਆ", "ਇੱਥੋਂ ਰਵਾਨਗੀ", "ਇੱਥੋਂ ਤੱਕ", "ਰਾਈਡਾਂ ਤਰਤੀਬ ਦਿਓ", "ਸੀਟਾਂ", "ਭੂਮਿਕਾ", "ਪਛਾਣ ਸਥਿਤੀ", "ਖਾਤੇ ਦੀ ਸਥਿਤੀ", "ਸਥਿਤੀ", "ਸ਼ਹਿਰ", "ਰਾਜ", "ਦੇਸ਼", "ਵਰਤੋਂਕਾਰ ID", "ਰਾਈਡ ID", "ਮੁਕੰਮਲ ਬੁਕਿੰਗ ID", "ਛੋਟਾ ਨਾਮ (ਵਿਕਲਪਿਕ)", "ਸਿਰਫ਼ ਆਖ਼ਰੀ ਚਾਰ ਅੱਖਰ", "ਡਰਾਈਵਿੰਗ ਲਾਇਸੈਂਸ ਨੰਬਰ", "ਵਾਹਨ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਨੰਬਰ", "ਨਾਮ, ਈਮੇਲ ਜਾਂ ਫ਼ੋਨ ਖੋਜੋ", "ਨਾਮ, ਸ਼ਹਿਰ ਜਾਂ ਡੋਮੇਨ ਖੋਜੋ"],
};
for (const [locale, values] of Object.entries(extendedFormLabels)) {
  const labels = Object.fromEntries(extendedFormLabelKeys.map((key, index) => [key, values[index]]));
  Object.assign(resources[locale].translation.forms.labels, labels);
}

const mapMessageKeys = [
  "mapDisplayLayer", "satellite", "streetMap", "mapTilesError", "loadingMap",
  "useCurrentLocation", "findingLocation", "searchPlacePlaceholder", "searchPlaces",
  "searchingPlaces", "placeSuggestions", "noPlacesMatched", "providerNote",
  "lookingUpMapPoint", "mapPoint", "addressLookupFailed", "moveMarkerResolveAddress",
  "clearLocation", "confirmLocation", "unsupportedGeolocation", "locationPermissionDenied",
  "currentLocationUnavailable", "locationTimeout", "enterThreeCharacters", "noMatchingPlaces",
];
const mapMessages = {
  en: ["Map display layer", "Satellite", "Street Map", "Some map tiles could not be loaded.", "Loading {{layer}} map…", "Use my current location", "Finding location…", "Search a place, address or area…", "Search places", "Searching…", "Place suggestions", "No places matched that search.", "Search and map addresses use OpenStreetMap Nominatim. Submit a query to see suggestions; type-ahead search is disabled to follow provider policy.", "Looking up this map point…", "Map point", "Address lookup failed; this point has no resolved address.", "Move the marker or click the map to resolve an address.", "Clear location", "Confirm location", "This browser does not support location access.", "Location permission was denied. Allow access in your browser settings or choose a place on the map.", "Your current location is unavailable. Search for a place or choose one on the map.", "Location took too long to respond. Try again or choose a place on the map.", "Enter at least 3 characters to search for a place.", "No matching places found. Try a nearby area or a more specific search."],
  hi: ["मानचित्र प्रदर्शन परत", "उपग्रह", "सड़क मानचित्र", "कुछ मानचित्र टाइल लोड नहीं हो सकीं।", "{{layer}} मानचित्र लोड हो रहा है…", "मेरी वर्तमान जगह का उपयोग करें", "स्थान खोज रहे हैं…", "जगह, पता या क्षेत्र खोजें…", "जगह खोजें", "खोज रहे हैं…", "जगह के सुझाव", "इस खोज से कोई जगह नहीं मिली।", "खोज और मानचित्र के पते OpenStreetMap Nominatim का उपयोग करते हैं। सुझाव देखने के लिए खोज भेजें; प्रदाता नीति के अनुसार टाइप करते समय खोज बंद है।", "इस मानचित्र बिंदु का पता लगाया जा रहा है…", "मानचित्र बिंदु", "पता नहीं मिला; इस बिंदु का सत्यापित पता उपलब्ध नहीं है।", "पता खोजने के लिए मार्कर ले जाएँ या मानचित्र पर क्लिक करें।", "स्थान साफ़ करें", "स्थान की पुष्टि करें", "यह ब्राउज़र स्थान तक पहुँच का समर्थन नहीं करता।", "स्थान अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें या मानचित्र पर जगह चुनें।", "वर्तमान स्थान उपलब्ध नहीं है। जगह खोजें या मानचित्र पर चुनें।", "स्थान खोजने में बहुत समय लगा। फिर कोशिश करें या मानचित्र पर जगह चुनें।", "जगह खोजने के लिए कम से कम 3 अक्षर लिखें।", "कोई मिलती-जुलती जगह नहीं मिली। पास का क्षेत्र या अधिक सटीक खोज आज़माएँ।"],
  bn: ["মানচিত্র প্রদর্শনের স্তর", "স্যাটেলাইট", "রাস্তার মানচিত্র", "কিছু মানচিত্র টাইল লোড করা যায়নি।", "{{layer}} মানচিত্র লোড হচ্ছে…", "আমার বর্তমান অবস্থান ব্যবহার করুন", "অবস্থান খোঁজা হচ্ছে…", "স্থান, ঠিকানা বা এলাকা খুঁজুন…", "স্থান খুঁজুন", "খোঁজা হচ্ছে…", "স্থানের পরামর্শ", "এই অনুসন্ধানে কোনো স্থান মেলেনি।", "অনুসন্ধান ও মানচিত্রের ঠিকানায় OpenStreetMap Nominatim ব্যবহৃত হয়। পরামর্শ পেতে অনুসন্ধান জমা দিন; নীতিমালা মেনে টাইপ-আহেড বন্ধ।", "এই মানচিত্র বিন্দুর ঠিকানা খোঁজা হচ্ছে…", "মানচিত্র বিন্দু", "ঠিকানা খোঁজা যায়নি; এই বিন্দুর নির্দিষ্ট ঠিকানা মেলেনি।", "ঠিকানা খুঁজতে মার্কার সরান বা মানচিত্রে ক্লিক করুন।", "অবস্থান মুছুন", "অবস্থান নিশ্চিত করুন", "এই ব্রাউজারে অবস্থান ব্যবহারের সুবিধা নেই।", "অবস্থানের অনুমতি দেওয়া হয়নি। ব্রাউজারে অনুমতি দিন অথবা মানচিত্রে স্থান বেছে নিন।", "আপনার বর্তমান অবস্থান পাওয়া যাচ্ছে না। স্থান খুঁজুন বা মানচিত্রে বেছে নিন।", "অবস্থান পেতে বেশি সময় লাগছে। আবার চেষ্টা করুন বা মানচিত্রে স্থান বেছে নিন।", "স্থান খুঁজতে অন্তত ৩টি অক্ষর লিখুন।", "কোনো মিলযুক্ত স্থান নেই। কাছের এলাকা বা আরও নির্দিষ্টভাবে খুঁজুন।"],
  mr: ["नकाशा प्रदर्शन स्तर", "उपग्रह", "रस्त्याचा नकाशा", "काही नकाशा टाइल लोड होऊ शकल्या नाहीत.", "{{layer}} नकाशा लोड होत आहे…", "माझे वर्तमान स्थान वापरा", "स्थान शोधत आहे…", "ठिकाण, पत्ता किंवा परिसर शोधा…", "ठिकाणे शोधा", "शोधत आहे…", "ठिकाणाच्या सूचना", "या शोधाशी जुळणारे ठिकाण सापडले नाही.", "शोध आणि नकाशाचे पत्ते OpenStreetMap Nominatim वापरतात. सूचना पाहण्यासाठी शोध सबमिट करा; प्रदात्याच्या नियमानुसार टाइप-अहेड बंद आहे.", "या नकाशा बिंदूचा पत्ता शोधत आहे…", "नकाशा बिंदू", "पत्ता शोधता आला नाही; या बिंदूचा निश्चित पत्ता उपलब्ध नाही.", "पत्ता शोधण्यासाठी मार्कर हलवा किंवा नकाशावर क्लिक करा.", "स्थान साफ करा", "स्थान निश्चित करा", "हा ब्राउझर स्थान प्रवेशाला समर्थन देत नाही.", "स्थान परवानगी नाकारली. ब्राउझर सेटिंग्जमध्ये परवानगी द्या किंवा नकाशावर ठिकाण निवडा.", "तुमचे वर्तमान स्थान उपलब्ध नाही. ठिकाण शोधा किंवा नकाशावर निवडा.", "स्थान मिळण्यास वेळ लागत आहे. पुन्हा प्रयत्न करा किंवा नकाशावर ठिकाण निवडा.", "ठिकाण शोधण्यासाठी किमान ३ अक्षरे टाका.", "जुळणारी ठिकाणे सापडली नाहीत. जवळचा परिसर किंवा अधिक विशिष्ट शोध वापरा."],
  ta: ["வரைபடக் காட்சி அடுக்கு", "செயற்கைக்கோள்", "தெரு வரைபடம்", "சில வரைபடத் துண்டுகளை ஏற்ற முடியவில்லை.", "{{layer}} வரைபடம் ஏற்றப்படுகிறது…", "எனது தற்போதைய இடத்தைப் பயன்படுத்து", "இடம் கண்டறியப்படுகிறது…", "இடம், முகவரி அல்லது பகுதியைத் தேடு…", "இடங்களைத் தேடு", "தேடுகிறது…", "இடப் பரிந்துரைகள்", "இந்தத் தேடலில் இடங்கள் இல்லை.", "தேடல் மற்றும் வரைபட முகவரிகள் OpenStreetMap Nominatim-ஐப் பயன்படுத்துகின்றன. பரிந்துரைகளுக்கு தேடலைச் சமர்ப்பிக்கவும்; வழங்குநர் விதிப்படி தட்டச்சு-தேடல் முடக்கப்பட்டுள்ளது.", "இந்த வரைபடப் புள்ளியைத் தேடுகிறது…", "வரைபடப் புள்ளி", "முகவரியைக் கண்டறிய முடியவில்லை; இந்தப் புள்ளிக்கு உறுதிப்படுத்தப்பட்ட முகவரி இல்லை.", "முகவரியைக் கண்டறிய குறியீட்டை நகர்த்தவும் அல்லது வரைபடத்தில் சொடுக்கவும்.", "இடத்தை அழி", "இடத்தை உறுதிசெய்", "இந்த உலாவி இட அணுகலை ஆதரிக்காது.", "இட அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் அனுமதிக்கவும் அல்லது வரைபடத்தில் இடத்தைத் தேர்ந்தெடுக்கவும்.", "தற்போதைய இடம் கிடைக்கவில்லை. இடத்தைத் தேடவும் அல்லது வரைபடத்தில் தேர்ந்தெடுக்கவும்.", "இடம் கண்டறிய அதிக நேரம் ஆகிறது. மீண்டும் முயற்சிக்கவும் அல்லது வரைபடத்தில் தேர்ந்தெடுக்கவும்.", "இடத்தைத் தேட குறைந்தது 3 எழுத்துகளை உள்ளிடவும்.", "பொருந்தும் இடங்கள் இல்லை. அருகிலுள்ள பகுதியை அல்லது குறிப்பிட்ட தேடலை முயற்சிக்கவும்."],
  te: ["మ్యాప్ ప్రదర్శన పొర", "శాటిలైట్", "వీధి మ్యాప్", "కొన్ని మ్యాప్ టైల్స్ లోడ్ కాలేదు.", "{{layer}} మ్యాప్ లోడ్ అవుతోంది…", "నా ప్రస్తుత స్థానాన్ని ఉపయోగించండి", "స్థానాన్ని కనుగొంటోంది…", "ప్రదేశం, చిరునామా లేదా ప్రాంతాన్ని వెతకండి…", "ప్రదేశాలను వెతకండి", "వెతుకుతోంది…", "ప్రదేశ సూచనలు", "ఈ శోధనకు ప్రదేశాలు సరిపోలలేదు.", "శోధన, మ్యాప్ చిరునామాల కోసం OpenStreetMap Nominatim ఉపయోగించబడుతుంది. సూచనల కోసం శోధనను సమర్పించండి; ప్రొవైడర్ విధానం ప్రకారం టైప్-అహెడ్ నిలిపివేయబడింది.", "ఈ మ్యాప్ పాయింట్‌ను వెతుకుతోంది…", "మ్యాప్ పాయింట్", "చిరునామా కనుగొనబడలేదు; ఈ పాయింట్‌కు నిర్ధారిత చిరునామా లేదు.", "చిరునామాను గుర్తించడానికి మార్కర్‌ను కదపండి లేదా మ్యాప్‌పై క్లిక్ చేయండి.", "స్థానాన్ని క్లియర్ చేయండి", "స్థానాన్ని నిర్ధారించండి", "ఈ బ్రౌజర్ స్థాన ప్రాప్యతకు మద్దతు ఇవ్వదు.", "స్థాన అనుమతి నిరాకరించబడింది. బ్రౌజర్ సెట్టింగ్‌లలో అనుమతించండి లేదా మ్యాప్‌లో ప్రదేశాన్ని ఎంచుకోండి.", "ప్రస్తుత స్థానం అందుబాటులో లేదు. ప్రదేశాన్ని వెతకండి లేదా మ్యాప్‌లో ఎంచుకోండి.", "స్థానాన్ని పొందడానికి ఎక్కువ సమయం పడుతోంది. మళ్లీ ప్రయత్నించండి లేదా మ్యాప్‌లో ఎంచుకోండి.", "ప్రదేశం కోసం కనీసం 3 అక్షరాలు నమోదు చేయండి.", "సరిపోలే ప్రదేశాలు కనబడలేదు. సమీప ప్రాంతం లేదా మరింత నిర్దిష్ట శోధన ప్రయత్నించండి."],
  gu: ["નકશા પ્રદર્શન સ્તર", "સેટેલાઇટ", "શેરી નકશો", "કેટલીક નકશા ટાઇલ લોડ થઈ શકી નથી.", "{{layer}} નકશો લોડ થઈ રહ્યો છે…", "મારું વર્તમાન સ્થાન વાપરો", "સ્થાન શોધી રહ્યા છીએ…", "સ્થળ, સરનામું અથવા વિસ્તાર શોધો…", "સ્થળો શોધો", "શોધી રહ્યા છીએ…", "સ્થળ સૂચનો", "આ શોધમાં કોઈ સ્થળ મળ્યું નથી.", "શોધ અને નકશાના સરનામા OpenStreetMap Nominatim વાપરે છે. સૂચનો માટે શોધ સબમિટ કરો; પ્રદાતાની નીતિ મુજબ ટાઇપ-અહેડ બંધ છે.", "આ નકશા બિંદુ શોધી રહ્યા છીએ…", "નકશા બિંદુ", "સરનામું મળ્યું નથી; આ બિંદુનું નિશ્ચિત સરનામું ઉપલબ્ધ નથી.", "સરનામું શોધવા માર્કર ખસેડો અથવા નકશા પર ક્લિક કરો.", "સ્થાન સાફ કરો", "સ્થાનની પુષ્ટિ કરો", "આ બ્રાઉઝર સ્થાન ઍક્સેસને સપોર્ટ કરતું નથી.", "સ્થાનની પરવાનગી નકારી. બ્રાઉઝર સેટિંગમાં મંજૂરી આપો અથવા નકશા પર સ્થળ પસંદ કરો.", "વર્તમાન સ્થાન ઉપલબ્ધ નથી. સ્થળ શોધો અથવા નકશા પર પસંદ કરો.", "સ્થાન મેળવવામાં વધુ સમય લાગ્યો. ફરી પ્રયાસ કરો અથવા નકશા પર પસંદ કરો.", "સ્થળ શોધવા ઓછામાં ઓછા 3 અક્ષરો લખો.", "મળતા સ્થળો મળ્યા નથી. નજીકનો વિસ્તાર અથવા વધુ ચોક્કસ શોધ અજમાવો."],
  kn: ["ನಕ್ಷೆ ಪ್ರದರ್ಶನ ಪದರ", "ಉಪಗ್ರಹ", "ರಸ್ತೆ ನಕ್ಷೆ", "ಕೆಲವು ನಕ್ಷೆ ಟೈಲ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.", "{{layer}} ನಕ್ಷೆ ಲೋಡ್ ಆಗುತ್ತಿದೆ…", "ನನ್ನ ಪ್ರಸ್ತುತ ಸ್ಥಳವನ್ನು ಬಳಸಿ", "ಸ್ಥಳ ಹುಡುಕಲಾಗುತ್ತಿದೆ…", "ಸ್ಥಳ, ವಿಳಾಸ ಅಥವಾ ಪ್ರದೇಶ ಹುಡುಕಿ…", "ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಿ", "ಹುಡುಕಲಾಗುತ್ತಿದೆ…", "ಸ್ಥಳ ಸಲಹೆಗಳು", "ಈ ಹುಡುಕಾಟಕ್ಕೆ ಸ್ಥಳಗಳು ಹೊಂದಿಕೆಯಾಗಲಿಲ್ಲ.", "ಹುಡುಕಾಟ ಮತ್ತು ನಕ್ಷೆ ವಿಳಾಸಗಳು OpenStreetMap Nominatim ಬಳಸುತ್ತವೆ. ಸಲಹೆಗಳಿಗೆ ಹುಡುಕಾಟ ಸಲ್ಲಿಸಿ; ಪೂರೈಕೆದಾರರ ನೀತಿಯಂತೆ ಟೈಪ್-ಅಹೆಡ್ ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ.", "ಈ ನಕ್ಷೆ ಬಿಂದುವನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ…", "ನಕ್ಷೆ ಬಿಂದು", "ವಿಳಾಸ ಪತ್ತೆಯಾಗಲಿಲ್ಲ; ಈ ಬಿಂದುವಿಗೆ ದೃಢೀಕೃತ ವಿಳಾಸವಿಲ್ಲ.", "ವಿಳಾಸ ಪತ್ತೆಹಚ್ಚಲು ಗುರುತನ್ನು ಸರಿಸಿ ಅಥವಾ ನಕ್ಷೆಯನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ.", "ಸ್ಥಳ ತೆರವುಗೊಳಿಸಿ", "ಸ್ಥಳ ದೃಢೀಕರಿಸಿ", "ಈ ಬ್ರೌಸರ್ ಸ್ಥಳ ಪ್ರವೇಶವನ್ನು ಬೆಂಬಲಿಸುವುದಿಲ್ಲ.", "ಸ್ಥಳ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಅನುಮತಿಸಿ ಅಥವಾ ನಕ್ಷೆಯಲ್ಲಿ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ.", "ಪ್ರಸ್ತುತ ಸ್ಥಳ ಲಭ್ಯವಿಲ್ಲ. ಸ್ಥಳವನ್ನು ಹುಡುಕಿ ಅಥವಾ ನಕ್ಷೆಯಲ್ಲಿ ಆಯ್ಕೆಮಾಡಿ.", "ಸ್ಥಳ ಹುಡುಕಲು ಹೆಚ್ಚು ಸಮಯ ತೆಗೆದುಕೊಂಡಿತು. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ನಕ್ಷೆಯಲ್ಲಿ ಆಯ್ಕೆಮಾಡಿ.", "ಸ್ಥಳ ಹುಡುಕಲು ಕನಿಷ್ಠ 3 ಅಕ್ಷರಗಳನ್ನು ನಮೂದಿಸಿ.", "ಹೊಂದಾಣಿಕೆಯ ಸ್ಥಳಗಳು ಸಿಗಲಿಲ್ಲ. ಹತ್ತಿರದ ಪ್ರದೇಶ ಅಥವಾ ಹೆಚ್ಚು ನಿರ್ದಿಷ್ಟ ಹುಡುಕಾಟ ಪ್ರಯತ್ನಿಸಿ."],
  ml: ["മാപ്പ് പ്രദർശന പാളി", "സാറ്റലൈറ്റ്", "തെരുവ് മാപ്പ്", "ചില മാപ്പ് ടൈലുകൾ ലോഡ് ചെയ്യാനായില്ല.", "{{layer}} മാപ്പ് ലോഡ് ചെയ്യുന്നു…", "എന്റെ നിലവിലെ സ്ഥലം ഉപയോഗിക്കുക", "സ്ഥലം കണ്ടെത്തുന്നു…", "സ്ഥലം, വിലാസം അല്ലെങ്കിൽ പ്രദേശം തിരയുക…", "സ്ഥലങ്ങൾ തിരയുക", "തിരയുന്നു…", "സ്ഥല നിർദ്ദേശങ്ങൾ", "ഈ തിരയലിൽ സ്ഥലങ്ങളൊന്നും കണ്ടെത്തിയില്ല.", "തിരയലിനും മാപ്പ് വിലാസങ്ങൾക്കും OpenStreetMap Nominatim ഉപയോഗിക്കുന്നു. നിർദ്ദേശങ്ങൾക്കായി തിരയൽ സമർപ്പിക്കുക; നയപ്രകാരം ടൈപ്പ്-അഹെഡ് തിരയൽ പ്രവർത്തനരഹിതമാണ്.", "ഈ മാപ്പ് പോയിന്റ് കണ്ടെത്തുന്നു…", "മാപ്പ് പോയിന്റ്", "വിലാസം കണ്ടെത്താനായില്ല; ഈ പോയിന്റിന് സ്ഥിരീകരിച്ച വിലാസമില്ല.", "വിലാസം കണ്ടെത്താൻ മാർക്കർ നീക്കുക അല്ലെങ്കിൽ മാപ്പിൽ ക്ലിക്ക് ചെയ്യുക.", "സ്ഥലം മായ്ക്കുക", "സ്ഥലം സ്ഥിരീകരിക്കുക", "ഈ ബ്രൗസർ ലൊക്കേഷൻ ആക്‌സസ് പിന്തുണയ്ക്കുന്നില്ല.", "ലൊക്കേഷൻ അനുമതി നിരസിച്ചു. ബ്രൗസർ ക്രമീകരണത്തിൽ അനുവദിക്കുക അല്ലെങ്കിൽ മാപ്പിൽ സ്ഥലം തിരഞ്ഞെടുക്കുക.", "നിലവിലെ സ്ഥലം ലഭ്യമല്ല. സ്ഥലം തിരയുക അല്ലെങ്കിൽ മാപ്പിൽ തിരഞ്ഞെടുക്കുക.", "സ്ഥലം കണ്ടെത്താൻ സമയമെടുത്തു. വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ മാപ്പിൽ തിരഞ്ഞെടുക്കുക.", "സ്ഥലം തിരയാൻ കുറഞ്ഞത് 3 അക്ഷരങ്ങൾ നൽകുക.", "പൊരുത്തമുള്ള സ്ഥലങ്ങളില്ല. സമീപ പ്രദേശമോ കൂടുതൽ കൃത്യമായ തിരയലോ ശ്രമിക്കുക."],
  pa: ["ਨਕਸ਼ਾ ਦਿਖਾਉਣ ਦੀ ਪਰਤ", "ਸੈਟੇਲਾਈਟ", "ਸੜਕ ਨਕਸ਼ਾ", "ਕੁਝ ਨਕਸ਼ਾ ਟਾਈਲਾਂ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੀਆਂ।", "{{layer}} ਨਕਸ਼ਾ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…", "ਮੇਰਾ ਮੌਜੂਦਾ ਟਿਕਾਣਾ ਵਰਤੋ", "ਟਿਕਾਣਾ ਲੱਭ ਰਿਹਾ ਹੈ…", "ਥਾਂ, ਪਤਾ ਜਾਂ ਇਲਾਕਾ ਲੱਭੋ…", "ਥਾਵਾਂ ਲੱਭੋ", "ਖੋਜ ਜਾਰੀ ਹੈ…", "ਥਾਂ ਦੇ ਸੁਝਾਅ", "ਇਸ ਖੋਜ ਨਾਲ ਕੋਈ ਥਾਂ ਨਹੀਂ ਮਿਲੀ।", "ਖੋਜ ਅਤੇ ਨਕਸ਼ੇ ਦੇ ਪਤੇ OpenStreetMap Nominatim ਵਰਤਦੇ ਹਨ। ਸੁਝਾਵਾਂ ਲਈ ਖੋਜ ਜਮ੍ਹਾਂ ਕਰੋ; ਨੀਤੀ ਮੁਤਾਬਕ ਟਾਈਪ-ਅਹੈੱਡ ਬੰਦ ਹੈ।", "ਇਸ ਨਕਸ਼ਾ ਬਿੰਦੂ ਦਾ ਪਤਾ ਲੱਭ ਰਿਹਾ ਹੈ…", "ਨਕਸ਼ਾ ਬਿੰਦੂ", "ਪਤਾ ਨਹੀਂ ਮਿਲਿਆ; ਇਸ ਬਿੰਦੂ ਦਾ ਪੱਕਾ ਪਤਾ ਉਪਲਬਧ ਨਹੀਂ।", "ਪਤਾ ਲੱਭਣ ਲਈ ਮਾਰਕਰ ਹਿਲਾਓ ਜਾਂ ਨਕਸ਼ੇ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।", "ਟਿਕਾਣਾ ਸਾਫ਼ ਕਰੋ", "ਟਿਕਾਣੇ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ", "ਇਹ ਬ੍ਰਾਊਜ਼ਰ ਟਿਕਾਣਾ ਪਹੁੰਚ ਦਾ ਸਮਰਥਨ ਨਹੀਂ ਕਰਦਾ।", "ਟਿਕਾਣੇ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਬ੍ਰਾਊਜ਼ਰ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਮਨਜ਼ੂਰੀ ਦਿਓ ਜਾਂ ਨਕਸ਼ੇ 'ਤੇ ਥਾਂ ਚੁਣੋ।", "ਮੌਜੂਦਾ ਟਿਕਾਣਾ ਉਪਲਬਧ ਨਹੀਂ। ਥਾਂ ਲੱਭੋ ਜਾਂ ਨਕਸ਼ੇ 'ਤੇ ਚੁਣੋ।", "ਟਿਕਾਣਾ ਲੱਭਣ ਵਿੱਚ ਸਮਾਂ ਲੱਗਿਆ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਨਕਸ਼ੇ 'ਤੇ ਚੁਣੋ।", "ਥਾਂ ਲੱਭਣ ਲਈ ਘੱਟੋ-ਘੱਟ 3 ਅੱਖਰ ਦਿਓ।", "ਕੋਈ ਮਿਲਦੀ ਥਾਂ ਨਹੀਂ ਮਿਲੀ। ਨੇੜਲਾ ਇਲਾਕਾ ਜਾਂ ਵਧੇਰੇ ਖਾਸ ਖੋਜ ਅਜ਼ਮਾਓ।"],
};
const errorsLocationKeys = [
  "unsupportedGeolocation", "locationPermissionDenied", "currentLocationUnavailable", "locationTimeout",
  "enterThreeCharacters", "noMatchingPlaces",
];
for (const [locale, values] of Object.entries(mapMessages)) {
  const messages = Object.fromEntries(mapMessageKeys.map((key, index) => [key, values[index]]));
  resources[locale].translation.common.map = messages;
  resources[locale].translation.errors.location = Object.fromEntries(
    errorsLocationKeys.map((key) => [key, messages[key]])
  );
}
const locationLabels = {
  en: { pickupLocation: "Pickup location", dropOffLocation: "Drop-off location", organizationAddress: "Organization address" },
  hi: { pickupLocation: "पिकअप स्थान", dropOffLocation: "ड्रॉप-ऑफ़ स्थान", organizationAddress: "संस्थान का पता" },
  bn: { pickupLocation: "যাত্রা শুরুর স্থান", dropOffLocation: "যাত্রা শেষের স্থান", organizationAddress: "প্রতিষ্ঠানের ঠিকানা" },
  mr: { pickupLocation: "पिकअपचे ठिकाण", dropOffLocation: "ड्रॉप-ऑफचे ठिकाण", organizationAddress: "संस्थेचा पत्ता" },
  ta: { pickupLocation: "ஏறும் இடம்", dropOffLocation: "இறங்கும் இடம்", organizationAddress: "நிறுவன முகவரி" },
  te: { pickupLocation: "పికప్ స్థలం", dropOffLocation: "డ్రాప్-ఆఫ్ స్థలం", organizationAddress: "సంస్థ చిరునామా" },
  gu: { pickupLocation: "પિકઅપ સ્થાન", dropOffLocation: "ડ્રોપ-ઑફ સ્થાન", organizationAddress: "સંસ્થાનું સરનામું" },
  kn: { pickupLocation: "ಪಿಕಪ್ ಸ್ಥಳ", dropOffLocation: "ಡ್ರಾಪ್-ಆಫ್ ಸ್ಥಳ", organizationAddress: "ಸಂಸ್ಥೆಯ ವಿಳಾಸ" },
  ml: { pickupLocation: "പിക്കപ്പ് സ്ഥലം", dropOffLocation: "ഡ്രോപ്പ്-ഓഫ് സ്ഥലം", organizationAddress: "സ്ഥാപന വിലാസം" },
  pa: { pickupLocation: "ਪਿਕਅੱਪ ਥਾਂ", dropOffLocation: "ਡਰਾਪ-ਆਫ਼ ਥਾਂ", organizationAddress: "ਸੰਸਥਾ ਦਾ ਪਤਾ" },
};
for (const [locale, labels] of Object.entries(locationLabels)) {
  Object.assign(resources[locale].translation.common.map, labels);
}

export const supportedLanguages = [
  { code: "en", locale: "en-IN", nativeName: "English", name: "English" },
  { code: "hi", locale: "hi-IN", nativeName: "हिन्दी", name: "Hindi" },
  { code: "bn", locale: "bn-IN", nativeName: "বাংলা", name: "Bengali" },
  { code: "mr", locale: "mr-IN", nativeName: "मराठी", name: "Marathi" },
  { code: "ta", locale: "ta-IN", nativeName: "தமிழ்", name: "Tamil" },
  { code: "te", locale: "te-IN", nativeName: "తెలుగు", name: "Telugu" },
  { code: "gu", locale: "gu-IN", nativeName: "ગુજરાતી", name: "Gujarati" },
  { code: "kn", locale: "kn-IN", nativeName: "ಕನ್ನಡ", name: "Kannada" },
  { code: "ml", locale: "ml-IN", nativeName: "മലയാളം", name: "Malayalam" },
  { code: "pa", locale: "pa-IN", nativeName: "ਪੰਜਾਬੀ", name: "Punjabi" },
];

