import { Button } from "@/components/ui/button"
import { Edit3Icon } from "lucide-react"

export const ButtonEdit = () => {
    return(
        <Button
        className="border border-zinc-500/50 rounded-full cursor-pointer duration-200 ease-in-out hover:bg-zinc-500/70"
        >Editar <Edit3Icon/></Button>
    )
}