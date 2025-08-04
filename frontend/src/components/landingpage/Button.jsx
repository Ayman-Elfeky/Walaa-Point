import { Link } from "react-router-dom";

const Button = ({data, border, gradient}) => {
    return (
        <Link to="/login" className={`py-2 px-3 rounded-md ${border && 'border'} ${gradient && 'gradient text-white'}`}>
            {data}
        </Link>
    )
}

export default Button;