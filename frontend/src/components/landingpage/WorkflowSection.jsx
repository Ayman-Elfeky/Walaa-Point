import { useLanguage } from '../../contexts/LanguageContext';
import CheckListItem from "./CheckListItem";

const WorkflowSection = () => {
    const { t } = useLanguage();
    return (
        <div className="mt-30">
            <h2 className="title mt-6 tracking-wide">
                {t('workflow.title')} <span className="gradient text-transparent bg-clip-text"> {t('workflow.highlightedTitle')}</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center">
                <div className="flex justify-center items-center p-2 w-full lg:w-1/2">
                    {console.log("Don't Forget to Change the logo of EH")}
                    {/* Change the logo here */}
                    <img src='https://github.com/kushald/virtualr/blob/main/src/assets/code.jpg?raw=true' alt="Image" />
                </div>
                <div className="pt-12 w-full lg:w-1/2">
                    {t('workflow.items').map((list, index) => {
                        return (
                            <CheckListItem
                                key={index}
                                title={list.title}
                                desc={list.description}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default WorkflowSection