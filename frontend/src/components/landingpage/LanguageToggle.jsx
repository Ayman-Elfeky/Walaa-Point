import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className="flex rtl:ml-4 items-center gap-2 px-3 py-2 rounded-lg border border-neutral-700/80 hover:bg-neutral-800/10 transition-colors"
        >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'عربي' : 'English'}
        </button>
    );
};

export default LanguageToggle;
