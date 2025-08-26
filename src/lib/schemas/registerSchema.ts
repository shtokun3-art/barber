import { z } from "zod";
import { validatePasswordSecurity, validateEmail, PASSWORD_CONFIG } from "@/lib/security-config";

export const registerSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    phone: z.string().min(1, "Telefone é Obrigatório"),
    email: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        const validation = validateEmail(val);
        return validation.isValid;
      }, {
        message: "Email inválido ou não permitido"
      }),
    password: z
      .string()
      .min(PASSWORD_CONFIG.minLength, `A senha deve ter pelo menos ${PASSWORD_CONFIG.minLength} caracteres`)
      .max(PASSWORD_CONFIG.maxLength, `A senha deve ter no máximo ${PASSWORD_CONFIG.maxLength} caracteres`)
      .refine((password) => {
        const validation = validatePasswordSecurity(password);
        return validation.isValid;
      }, {
        message: "Senha deve ter pelo menos 4 caracteres"
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterForm = z.infer<typeof registerSchema>;