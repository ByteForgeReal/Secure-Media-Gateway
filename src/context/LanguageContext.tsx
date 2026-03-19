import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'he';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  upload: { en: 'Upload', he: 'העלאה' },
  preview: { en: 'Preview', he: 'תצוגה מקדימה' },
  admin: { en: 'Admin', he: 'ניהול' },
  secureUpload: { en: 'Secure Upload', he: 'העלאה מאובטחת' },
  password: { en: 'Password', he: 'סיסמה' },
  maxViews: { en: 'Max Views', he: 'מקסימום צפיות' },
  expiry: { en: 'Expiry', he: 'תוקף' },
  generateLink: { en: 'Generate Secure Link', he: 'צור קישור מאובטח' },
  unlock: { en: 'Unlock Access', he: 'שחרר גישה' },
  privateResource: { en: 'Private Resource', he: 'משאב פרטי' },
  dragToUpload: { en: 'Click or Drag to Upload', he: 'לחץ או גרור להעלאה' },
  upTo: { en: 'Up to 500MB • Images, Video, PDF', he: 'עד 500MB • תמונות, וידאו, PDF' },
  encrypting: { en: 'Encrypting & Uploading...', he: 'מצפין ומעלה...' },
  linkGenerated: { en: 'Link Generated!', he: 'הקישור נוצר!' },
  readyToShare: { en: 'Your media is now secure and ready to share', he: 'הקובץ שלך מאובטח ומוכן לשיתוף' },
  copy: { en: 'Copy', he: 'העתק' },
  uploadAnother: { en: 'Upload another file', he: 'העלה קובץ נוסף' },
  secureLiveView: { en: 'Secure Live View', he: 'תצוגה חיה מאובטחת' },
  accessedFrom: { en: 'Accessed From', he: 'גישה מכתובת' },
  timeLeft: { en: 'Time Left', he: 'זמן שנותר' },
  viewsRemaining: { en: 'Views Remaining', he: 'צפיות שנותרו' },
  protectedBy: { en: 'Protected by End-to-End Encryption', he: 'מוגן ע״י הצפנה מקצה לקצה' },
  systemHealthy: { en: 'System Healthy', he: 'מערכת תקינה' },
  activeLinks: { en: 'Recent Secure Links', he: 'קישורים פעילים אחרונים' },
  mediaName: { en: 'Media Name', he: 'שם המדיה' },
  views: { en: 'Views', he: 'צפיות' },
  status: { en: 'Status', he: 'סטטוס' },
  actions: { en: 'Actions', he: 'פעולות' },
};

const LanguageContext = createContext<any>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Language>('en');

  const t = (key: string) => translations[key]?.[lang] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <div dir={lang === 'he' ? 'rtl' : 'ltr'} className={lang === 'he' ? 'font-hebrew' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
