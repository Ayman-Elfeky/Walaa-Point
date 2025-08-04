
const Feature = ({icon, text, desc}) => {
    return (
        <>
            <div className="w-full sm:1/2 lg:w-1/3">
                <div className="flex">
                    <div className="flex mx-6 h-10 w-10 p-2 text-blue-700 justify-center items-center rounded-full">
                        {icon}
                    </div>
                    <div>
                        <h5 className="mt-1 mb-6 text-xl">{text}</h5>
                        <p className="text-md p-2 mb-20 text-neutral-500">{desc}</p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Feature