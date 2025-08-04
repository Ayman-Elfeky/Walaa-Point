import { Link } from "react-scroll";
import { useLanguage } from "../../contexts/LanguageContext";

const NavItems = ({ styling }) => {
    const { t } = useLanguage();
    t('nav.items').map((item) => {
        console.log(item.name);
        console.log(item.link);
    })

    return (
        <>
            {

                t('nav.items').map((item, index) => {
                    return (
                        <li key={index} className={styling}>
                            <Link className="cursor-pointer" to={item.link} smooth={true} duration={500}>
                                {item.name}
                            </Link>
                        </li>
                    )
                })
            }
        </>
    )
}

export default NavItems;