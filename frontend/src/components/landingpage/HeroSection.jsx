import { useLanguage } from "../../contexts/LanguageContext"
import Button from "./Button"
import HeroSubtitle from "./HeroSubtitle"
import HeroTitle from "./HeroTitle"

const HeroSection = () => {

    const { t } = useLanguage()

    return (
        <div className="flex flex-col items-center mt-6 lg:mt-20">
            <HeroTitle
                firstTitle={(t('hero.firstTitle'))}
                highlightedText={t('hero.highlightedText')}
                secondTitle={t('hero.secondTitle')}
            />
            <HeroSubtitle
                subtitle={t('hero.subtitle')}
            />
            <div className="flex justify-center my-10 space-x-5">
                <Button data={t('hero.startButton')} border={false} gradient={true} />
                <Button data={t('hero.docButton')} border={true} gradient={false} />
            </div>
            <div className="flex flex-col justify-center items-center mt-16">
                <p className="text-lg text-center text-neutral-500 max-w-4xl">{t('hero.integratedWith')}</p>
                {/* Don't Forget to change it */}
                {console.log("Don't Forget to change the Salla Logo")}
                <img src="https://loyalfy.io/_next/static/media/salla.987b508d.svg" alt="Salla Logo" className="h-40 w-60" />
            </div>
        </div>
    )
}

export default HeroSection