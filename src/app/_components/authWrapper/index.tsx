import { ReactNode } from "react"
import { twMerge } from "tailwind-merge"

export const AuthWrapper = ({children, ...rest}: {children: ReactNode, className?:string}) => {
    return(
        <div className="bg-[url('/auth_bg.svg')] h-dvh w-screen flex flex-col gap-2 px-4 items-center justify-center text-zinc-200">

            <div {...rest} className={twMerge("flex items-center justify-center w-full min-w-[300px] lg:max-w-[60%] h-[80%] p-6 bg-zinc-800/10 backdrop-blur-xs rounded-4xl shadow-lg border border-zinc-700/30", rest.className)}>
                {children}
            </div>

        </div>
    )
}