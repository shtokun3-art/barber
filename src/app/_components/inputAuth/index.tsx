import { Input } from "@/components/ui/input"
import { RegisterForm } from "@/lib/schemas/registerSchema"
import { InputHTMLAttributes } from "react"
import { FieldError, FieldErrors, UseFormRegister } from "react-hook-form"
import { twMerge } from "tailwind-merge"

interface InputAuthProps extends InputHTMLAttributes<HTMLInputElement>{
    errors: FieldError | undefined
    register: UseFormRegister<RegisterForm>
    id: "name" | "phone" | "email" | "password" | "confirmPassword"
    type: "email" | "password" | "text" | "tel"
    className?: string
    text: string
    showPassword?: boolean
    message: string | undefined
}

export const InputAuth = ({showPassword, text, errors, message, register, id, type, ...rest}: InputAuthProps) => {
    return(
        <div>
            <label htmlFor={id} className="md:block hidden text-zinc-50 mb-1">
                {text}
            </label>
            <Input
            id={id}
            type={showPassword ? "text" : `${type}`}
            {...register(id)}
            {...rest}
            className={twMerge("w-full px-2 bg-zinc-200 h-10 text-zinc-900 border border-orange-300 rounded-full focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-zinc-900/60 pl-4", rest.className)}
            />

            {errors && <p className="text-red-400 text-sm mt-1">{message}</p>}
        </div>
    )
}