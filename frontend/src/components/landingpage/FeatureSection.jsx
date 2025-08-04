import { features } from "../../constants/index.jsx"
import { useLanguage } from "../../contexts/LanguageContext";
import Feature from "./Feature";

const FeatureSection = () => {
    const { t, language } = useLanguage()
    return (
        // why there is realtive here becuase of the navbar
        <div className="mt-30 border-b border-neutral-800 min-h-[800px]">
            <div className="text-center">
                <span className="text-blue-500 rounded-full h-6 text-2xl font-medium px-2 py-1 uppercase">
                    {t('features.title')}
                </span>
                <h2 className="title mt-10 lg:mt-20 tracking-wide">
                    {t('features.subtitle')}<span className="gradient text-transparent bg-clip-text">{t('features.highlightedSubtitle')}</span>
                </h2>
            </div>
            <div className="flex flex-wrap mt-10 lg:mt-20">
                {features[language].map((feature, index) => {
                    return (
                        <Feature
                            key={index}
                            icon={feature.icon}
                            text={feature.text}
                            desc={feature.description}
                        />
                    );
                })}
            </div>
        </div>
    )
}

export default FeatureSection