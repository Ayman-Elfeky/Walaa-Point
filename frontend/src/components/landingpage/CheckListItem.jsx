import { CheckCircle2 } from "lucide-react"

const CheckListItem = ({title, desc}) => {
    return (
        <div className="flex mb-12">
            <div className="text-blue-500 mx-6 h-10 w-10 p-2 justify-center items-center rounded-full">
                <CheckCircle2 />
            </div>
            <div>
                <h5 className="mt-1 mb-2 text-xl">{title}</h5>
                <p className="text-md text-neutral-5">{desc}</p>
            </div>
        </div>
    )
}

export default CheckListItem