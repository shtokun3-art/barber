import { useAuth } from "@/lib/AuthContext"
import { LogOutIcon, MenuIcon } from "lucide-react"
import Image from "next/image"
import { ButtonAccount } from "../../buttonAccount"
import { getImageUrl } from "@/lib/imageUtils"

interface HeaderMainPageMobileProps {
    setOpenSide: (val: boolean) => void
    openSide: boolean
}

export const HeaderMainPageMobile = ({setOpenSide, openSide}:HeaderMainPageMobileProps) => {

    return(
        <header className="fixed top-0 w-full h-16 sm:h-20 bg-[#020501] border-b-white/30 border-b lg:hidden flex items-center justify-between px-3 sm:px-4 z-30">

        <button
        onClick={() => setOpenSide(true)}
        className={`p-2 rounded-lg hover:bg-zinc-800/50 transition-colors ${openSide ? 'text-orange-500' : 'text-white'}`}
        >
          <MenuIcon size={24}/>
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          <Image
          src={getImageUrl('/img/barber_logo.png')}
          alt="Logo da Barbearia"
          width={40}
          height={40}
          className="sm:w-[50px] sm:h-[50px]"
          />
          <span className="font-bold underline underline-offset-4 text-sm sm:text-base">Barbearia WE</span>
        </div>

        <ButtonAccount/>
      
      </header>
    )
}