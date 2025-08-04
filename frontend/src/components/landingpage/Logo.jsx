const Logo = () => {
    return (
        <div className="flex justify-center items-center flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-primary-600 rounded"></div>
              </div>
            </div>
            <span className="text-xl tracking-light pb-4 ltr:ml-4 rtl:mr-4">
                LoyalCore
            </span>
        </div>
    )
}

export default Logo