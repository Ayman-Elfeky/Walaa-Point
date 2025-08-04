import { CheckCircle2 } from "lucide-react"

const PricingOption = ({ title, price, features, subscribe }) => {
    return (
        <div className="w-full lg:w-1/2 p-2">
            <div className={`p-10 border ${title === 'Pro' ? 'border-amber-800' : 'border-neutral-700'} rounded-xl`}>
                <p className="text-4xl mb-8">
                    {title}
                    {title === "Pro" &&
                        <span className="gradient text-transparent bg-clip-text text-lg mb-4 ml-2">
                            (Most Popular)
                        </span>
                    }
                </p>
                <p className="mb-8">
                    <span className="text-3xl mt-6 mr-2">{price}</span>
                    <span className="text-neutral-400 tracking-tight">/Month</span>
                </p>
                <ul className="mt-10">
                    {features.map((feature, index) => {
                        return <li key={index} className="mt-8 flex items-center">
                            <CheckCircle2 />
                            <span className="ml-2">{feature}</span>
                        </li>
                    })}
                </ul>
                <a href="#" className="btn btn-hover">{subscribe}</a>
            </div>
        </div>
    )
}

export default PricingOption