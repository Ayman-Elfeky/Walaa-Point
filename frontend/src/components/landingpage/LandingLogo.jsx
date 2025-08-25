import { useTranslation } from "react-i18next"
import Logo from "../common/Logo"

const LandingLogo = () => {
  const {t, i18n} = useTranslation()
    return (
        <div className="flex justify-center items-center flex-shrink-0">
            <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Logo />
            </div>
            <span className="text-xl tracking-light pb-4 ltr:ml-4 rtl:mr-4">
                {t('navigation.logoTitle')}
            </span>
        </div>
    )
}

export default LandingLogo