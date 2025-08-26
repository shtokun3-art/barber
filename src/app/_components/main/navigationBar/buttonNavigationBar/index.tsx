import { PageSelected } from "@/app/(pages)/main/[id]/page"
import { HTMLAttributes, ReactNode } from "react"
import { twMerge } from "tailwind-merge"

interface ButtonNavigationBarProps extends HTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    className?: string
    page: PageSelected
    ord: PageSelected
    notify?: number
}

export const ButtonNavigationBar = ({notify, ord, page, children, ...rest}:ButtonNavigationBarProps) => {
    return(
        <button
        {...rest}
            className={twMerge(`relative font-semibold flex items-center pl-2 gap-4 rounded-2xl w-full h-10 duration-200 ease-in-out hover:bg-zinc-700/70 hover:text-white cursor-pointer p-6 ${ord === page ? 'bg-zinc-700/70 text-white border-l-4 border-orange-500' : 'text-white'}`, rest.className)}
            >  
            {notify ? <span className="absolute top-1/2 -translate-y-1/2 right-4 bg-orange-500 text-zinc-100 w-6 h-6 rounded-full text-xs flex items-center justify-center">{notify}</span>: ''}
            {children}
        </button>
    )
}