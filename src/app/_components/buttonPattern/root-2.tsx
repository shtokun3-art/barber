import { Button } from "@/components/ui/button"
import { HTMLAttributes, ReactNode } from "react"
import { twMerge } from "tailwind-merge"

interface RootProps extends HTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    className?: string
    type?: 'submit' | 'button' | 'reset'
    disabled?: boolean
}

export const Root2 = ({children, disabled=false, type='button', ...rest}:RootProps) => {
    return(
        <Button
        {...rest}
        type={type}
        disabled={disabled}
        className={twMerge(`bg-zinc-700`, rest.className)}
        >
            {children}
        </Button>
    )
}