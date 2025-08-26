import { toast } from "sonner"

export const UserNotFounded = ({error}: {error: unknown}) => {
    const errorMessage = error instanceof Error ? error.message : "Usuário não encontrado";
    toast.error(errorMessage, {
            style: {
              background: "#18181b",
              color: "#e4e4e7",
              border: "1px solid #52525b",
            },
          })
}