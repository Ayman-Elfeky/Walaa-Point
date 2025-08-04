import { Copyright, CopyrightIcon, FacebookIcon, HandMetalIcon, InstagramIcon, MessageCircle, PhoneIcon, TwitterIcon } from "lucide-react";
import Logo from "./Logo";
import NavItems from "./NavItems";
import CopyrightSentence from "./CopyrightSentence";

const Footer = () => {
    return (
        <div className="mt-30 border-t border-neutral-800">
            <div className=" pt-5 flex flex-col items-start justify-between w-full">
                <Logo />
                <ul className="flex items-center justify-center w-full py-5">
                    <NavItems styling={"m-3"}/>
                </ul>
                <div className="flex items-center justify-between w-full py-5">
                    <CopyrightSentence company={"LoyalCore"} />
                    <div className="flex items-center justify-center gap-2">
                        <MessageCircle />
                        <PhoneIcon />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Footer