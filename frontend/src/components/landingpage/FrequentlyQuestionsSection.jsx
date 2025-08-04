
import { useLanguage } from "../../contexts/LanguageContext";
import Question from "./Question"

const FrequentlyQuestionsSection = () => {
    const { t } = useLanguage();
    return (
        <div className="mt-30 tracking-wide">
            <h2 className="title my-10 lg:my-20">{t('faq.title')}</h2>
            <div className="flex flex-wrap justify-center">
                {t('faq.items').map((testimonial, index) => {
                    return (
                        <Question
                            key={index}
                            text={testimonial.text}
                            company={testimonial.company}
                            user={testimonial.user}
                        />
                    )
                })}
            </div>
        </div>
    )
}

export default FrequentlyQuestionsSection