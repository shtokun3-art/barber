import { Input } from "@/components/ui/input"
import { InputHTMLAttributes } from "react"
import { FieldError, UseFormRegister, FieldValues, Path } from "react-hook-form"
import { twMerge } from "tailwind-merge"

interface InputAuthProps<T extends FieldValues> extends InputHTMLAttributes<HTMLInputElement>{
    errors: FieldError | undefined
    register: UseFormRegister<T>
    id: Path<T>
    type: "password" | "text"
    className?: string
    text: string
    showPassword?: boolean
    message: string | undefined
}

export const InputAuthLogin = <T extends FieldValues>({showPassword, text, errors, message, register, id, type, ...rest}: InputAuthProps<T>) => {
    return(
        <div>
            <label htmlFor="name" className="md:block hidden text-zinc-50 mb-1">
                {text}
            </label>
            <Input
            id={id}
            type={showPassword ? "text" : `${type}`}
            {...register(id)}
            {...rest}
            className={twMerge("w-full p-2 bg-zinc-200 h-12 text-zinc-900 border border-orange-300 rounded-full focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-zinc-900/60 pl-4", rest.className)}
            />

            {errors && <p className="text-red-400 text-sm mt-1">{message}</p>}
        </div>
    )
}