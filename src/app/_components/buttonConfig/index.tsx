import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { HTMLAttributes, ReactNode } from "react"
import { settings } from "../layouts/settings"
import { twMerge } from "tailwind-merge"

interface ButtonConfigProps extends HTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    selected: settings
    setSelected: (val: settings) => void
    prop: settings
    className?: string
}

export const ButtonConfig = ({children, selected, setSelected, prop, ...rest}:ButtonConfigProps) => {


    return(
        <Button
        {...rest}
            className={twMerge(`w-full flex items-center justify-between bg-zinc-800 gap-6 ease-in-out duration-200 hover:bg-zinc-800/60 cursor-pointer`, rest.className)}
            onClick={() => setSelected(prop)}
            >      
                <div className="w-full flex gap-4 items-center">
                    {children}
                </div>

                {prop === selected ? <ChevronRight className="text-orange-500"/> : ''}
                

        </Button>
    )
}