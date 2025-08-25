import NavItems from './NavItems'
import LandingLogo from './LandingLogo'
import Button from './Button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import LanguageToggle from './LanguageToggle'
import { useLanguage } from '../../contexts/LanguageContext'
const Navbar = () => {
    const [mobile, setMobile] = useState(false);
    const { t } = useLanguage();

    const toggleNavBar = () => {
        setMobile(!mobile);
    };

    return (
        <nav className="sticky top-0 py-3 backdrop-blur-lg border-b border-neutral-700/80">
            <div className="container px-4 mx-auto relative text-sm">
                <div className="flex justify-between items-center">
                    <LandingLogo />
                    <ul className="hidden lg:flex ltr:ml-14 ltr:space-x-12">
                        <NavItems styling={"btn-hover px-3 py-2 rounded-lg"} />
                    </ul>
                    <div className="hidden lg:flex justify-center space-x-5 items-center">
                        <LanguageToggle />
                        {/* <Button data={t('nav.signIn')} border={true} gradient={false} /> */}
                        <Button data={t('nav.signIn')} border={false} gradient={true} />
                    </div>
                    <div className="lg:hidden md:flex flex-col justify-end">
                        <button onClick={toggleNavBar}>
                            {mobile ? <X className='cursor-pointer' /> : <Menu className='cursor-pointer' />}
                        </button>
                    </div>
                </div>
                {mobile && (
                    <div className={`fixed right-0 z-20 ${localStorage.getItem('theme') === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'} w-full p-12 flex flex-col justify-center items-center lg:hidden`}>
                        <ul>
                            <NavItems styling='py-4' />
                        </ul>
                        <div className="flex flex-col items-center gap-5">
                            <LanguageToggle />
                            <div className="flex space-x-5">
                                <Button data={t('nav.signIn')} border={true} gradient={false} />
                                <Button data={t('nav.createAccount')} border={false} gradient={true} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar