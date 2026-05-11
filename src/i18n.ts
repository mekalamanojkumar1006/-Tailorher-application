import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app_name": "TailorHer by Venkata Laxmi",
      "tagline": "Elegant Tailoring for the Modern Woman",
      "nav": {
        "home": "Home",
        "services": "Services",
        "gallery": "Designs",
        "book": "Book Now",
        "orders": "Track Order",
        "contact": "Contact",
        "dashboard": "Dashboard"
      },
      "hero": {
        "title": "Your Perfect Fit, Just a Click Away",
        "subtitle": "Bespoke tailoring services with AI-powered size recommendations.",
        "cta": "Start Booking"
      },
      "auth": {
        "login": "Login",
        "register": "Register",
        "logout": "Logout",
        "welcome": "Welcome back, {{name}}"
      },
      "booking": {
        "title": "Book Your Stitching",
        "select_service": "Select Service",
        "upload_design": "Upload Design (Optional)",
        "measurements": "Enter Measurements",
        "submit": "Place Order",
        "status": "Order Status"
      },
      "languages": {
        "te": "తెలుగు",
        "en": "English"
      },
      "common": {
        "save": "Save",
        "cancel": "Cancel",
        "loading": "Loading...",
        "error": "Something went wrong"
      }
    }
  },
  te: {
    translation: {
      "app_name": "TailorHer by Venkata Laxmi",
      "tagline": "ఆధునిక మహిళ కోసం సొగసైన టైలరింగ్",
      "nav": {
        "home": "హోమ్",
        "services": "సేవలు",
        "gallery": "డిజైన్స్",
        "book": "బుక్ చేయండి",
        "orders": "ఆర్డర్ ట్రాక్",
        "contact": "సంప్రదించండి",
        "dashboard": "డ్యాష్‌బోర్డ్"
      },
      "hero": {
        "title": "మీ సరైన కొలత, కేవలం ఒక క్లిక్ దూరంలో",
        "subtitle": "AI-ఆధారిత పరిమాణ సిఫార్సులతో బెస్పోక్ టైలరింగ్ సేవలు.",
        "cta": "ఆర్డర్ ప్రారంభించండి"
      },
      "auth": {
        "login": "లాగిన్",
        "register": "నమోదు",
        "logout": "లాగ్ అవుట్",
        "welcome": "తిరిగి స్వాగతం, {{name}}"
      },
      "booking": {
        "title": "మీ స్టిచ్చింగ్‌ను బుక్ చేయండి",
        "select_service": "సేవను ఎంచుకోండి",
        "upload_design": "డిజైన్ అప్‌లోడ్ చేయండి (ఐచ్ఛికం)",
        "measurements": "కొలతలు నమోదు చేయండి",
        "submit": "ఆర్డర్ బుక్ చేయండి",
        "status": "ఆర్డర్ స్థితి"
      },
      "languages": {
        "te": "తెలుగు",
        "en": "English"
      },
      "common": {
        "save": "సేవ్",
        "cancel": "రద్దు",
        "loading": "లోడ్ అవుతోంది...",
        "error": "ఏదో తప్పు జరిగింది"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
