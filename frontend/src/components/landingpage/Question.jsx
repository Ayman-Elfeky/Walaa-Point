const Question = ({ text, user, company }) => {
    return (
        <div className="w-full sm:w-1/2 lg:w-1/3 px-4 py-2">
            <div className="bg-neutral rounded-md p-6 text-md border border-neutral-800 font-thin">
                <p>{text}</p>
                <div className="flex mt-8 items-center">
                    {/* Add Users image for there questions or if you want to convert it to positive feedbacks */}
                    {/* <img className="w-12 h-12 mr-6 rounded-full border border-neutral-300" src={image} alt={user} /> */}
                    <div>
                        <h6>{user}</h6>
                        <span className="text-sm font-normal italic text-neutral-600">{company}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Question