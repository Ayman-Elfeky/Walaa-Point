const HeroTitle = ({ firstTitle, highlightedText, secondTitle }) => {
    return (
        <h1 className="title tracking-wide rtl:leading-relaxed">
            {firstTitle}
            <span className="gradient text-transparent bg-clip-text">
                {` ${highlightedText}`}<br />
            </span>
            {secondTitle}
        </h1>
    )
}

export default HeroTitle