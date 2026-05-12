import { useTranslation } from 'react-i18next';
import { cn } from '@/src/lib/utils';

export function LanguageSwitch() {
  const { i18n } = useTranslation();

  return (
    <div
      className={cn(
        "px-1 py-1 rounded-full border border-natural-pink bg-natural-pink/30 text-natural-text text-xs font-bold transition-all",
        "flex items-center gap-1"
      )}
    >
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={cn(
          "px-3 py-1 rounded-full transition-all cursor-pointer",
          i18n.language === 'en' ? "bg-white shadow-sm" : "opacity-40 hover:opacity-70"
        )}
      >
        EN
      </button>
      <button
        onClick={() => i18n.changeLanguage('te')}
        className={cn(
          "px-3 py-1 rounded-full transition-all cursor-pointer",
          i18n.language === 'te' ? "bg-white shadow-sm" : "opacity-40 hover:opacity-70"
        )}
      >
        తెలుగు
      </button>
    </div>
  );
}
