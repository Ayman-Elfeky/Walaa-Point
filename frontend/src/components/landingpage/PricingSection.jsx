import { useLanguage } from "../../contexts/LanguageContext";
import PricingOption from "./PricingOption"

const PricingSection = () => {
    const { t } = useLanguage();
    return (
        <div className="mt-30">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl text-center my-8 tracking-wider">
                {t('pricing.title')}
            </h2>
            <div className="flex flex-wrap">
                {t('pricing.options').map((option, index) => {
                    return (
                        <PricingOption
                            key={index}
                            title={option.title}
                            price={option.price}
                            features={option.features}
                            subscribe={t('pricing.subscribe')}
                        />
                    )
                })}
            </div>
        </div>
    )
}

export default PricingSection