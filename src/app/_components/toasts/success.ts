import { toast } from "sonner";

export const Success = ({text}: {text: string}) =>
    toast.success(`${text}`, {
    style: {
      background: "#18181b",
      color: "#e4e4e7",
      border: "1px solid #52525b",
    },
  })