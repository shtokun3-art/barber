import { useAuth } from "@/lib/AuthContext"
import { LogOutIcon } from "lucide-react"
import { useEffect, useRef } from "react"
import { Spinner } from "../spinner"

interface ModalAccountButtonProps {
    setOpenModalAccount: (val:boolean) => void
    openModalAccount: boolean
}

export const ModalAccountButton = ({setOpenModalAccount, openModalAccount}:ModalAccountButtonProps) => {

    const modalRef = useRef<HTMLDivElement>(null)
    const {logout, loading} = useAuth()

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setOpenModalAccount(false)
            }
        }

        if (openModalAccount && typeof document !== 'undefined') {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            if (typeof document !== 'undefined') {
                document.removeEventListener('mousedown', handleClickOutside)
            }
        }
    }, [openModalAccount, setOpenModalAccount])

    return (
        <div
        ref={modalRef}
        className="absolute z-50 lg:-top-[200%] top-16 right-4 lg:w-full lg:left-0 w-[180px] rounded-xl border border-zinc-700/50 bg-zinc-900/95 backdrop-blur-sm p-3 shadow-2xl"
        >
            <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-200 cursor-pointer bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/30 rounded-lg duration-300 ease-in-out hover:from-red-600/40 hover:to-red-500/40 hover:border-red-400/50 hover:text-white transition-all group">
                <span className="flex items-center gap-3">
                    <LogOutIcon className="w-4 h-4 group-hover:scale-110 transition-transform"/>
                    {loading ? "Saindo..." : "Sair"}
                </span>
                {loading && <Spinner className="w-4 h-4"/>}
            </button>
        </div>
    )
}