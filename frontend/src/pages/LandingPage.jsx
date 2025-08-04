import FeatureSection from "../components/landingpage/FeatureSection"
import Footer from "../components/landingpage/Footer"
import FrequentlyQuestionsSection from "../components/landingpage/FrequentlyQuestionsSection"
import HeroSection from "../components/landingpage/HeroSection"
import Navbar from "../components/landingpage/Navbar"
import PricingSection from "../components/landingpage/PricingSection"
import WorkflowSection from "../components/landingpage/WorkflowSection"
import { LanguageProvider } from '../contexts/LanguageContext'

function LandingPage() {
    return (
        <LanguageProvider>
            <Navbar />
            <div className="max-w-7xl mx-auto px-6">
                {/* Add padding-top to account for fixed navbar */}
                <div className="pt-24">
                    <section id="home">
                        <HeroSection />
                    </section>
                    <section id="features">
                        <FeatureSection />
                    </section>
                    <section id="workflow">
                        <WorkflowSection />
                    </section>
                    <section id="pricing">
                        <PricingSection />
                    </section>
                    <section id="faq">
                        <FrequentlyQuestionsSection />
                    </section>
                    <Footer />
                </div>
            </div>
        </LanguageProvider>
    )
}

export default LandingPage