import { z } from "zod"
import { PASSWORD_CONFIG } from "@/lib/security-config"

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email ou telefone é obrigatório")
    .refine(
      (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\(\d{2}\)\s\d{1}\s\d{4}-\d{4}$|^\d{10,11}$/;
        return emailRegex.test(value) || phoneRegex.test(value)
      },
      {
        message: "Por favor, insira um email ou telefone válido",
      }
    ),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .max(PASSWORD_CONFIG.maxLength, `Senha deve ter no máximo ${PASSWORD_CONFIG.maxLength} caracteres`),
})

export type LoginForm = z.infer<typeof loginSchema>