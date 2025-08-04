import { useLanguage } from "../../contexts/LanguageContext";

const CopyrightSentence = ({ company }) => {
    const {language} = useLanguage();
    const date = new Date().getFullYear();

    return (
        <>
            {language === 'en' ?
                <p className="text-sm font-normal text-neutral-600">Copyright © {date} {company}. All rights reserved.</p>
                :
                <p className="text-sm font-normal text-neutral-600">جميع الحقوق محفوظة © {date} {company}.</p>
            }
        </> 
    )
}

export default CopyrightSentence