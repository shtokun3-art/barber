import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/AuthContext"
import { ChevronsUpDownIcon } from "lucide-react"
import Image from "next/image"
import { HTMLAttributes, useState } from "react"
import { twMerge } from "tailwind-merge"
import { ModalAccountButton } from "../modals/modalAccountButton"
import { UserInitialsAvatar } from "../userInitialsAvatar"
import { getImageUrl } from "@/lib/imageUtils"

interface ButtonAccountProps extends HTMLAttributes<HTMLButtonElement>{
    className?: string
    img?: string
}

export const ButtonAccount = ({img, ...rest}:ButtonAccountProps) => {

    const {user} = useAuth()
    const [openModalAccount, setOpenModalAccount] = useState<boolean>(false)

    const truncateText = (text: string | undefined, maxLength: number) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "..."; }

    return(
        <div className="relative lg:w-full ">

            <Button
            {...rest}
            onClick={() => setOpenModalAccount(true)}
            className={twMerge(`flex justify-between cursor-pointer duration-200 ease-in-out hover:bg-zinc-900/50 py-6 ${openModalAccount ? 'bg-zinc-900/50' : ''}`, rest.className)}
            >   
                <div className="flex gap-2 items-center">
                    {
                        img ? (
                            <Image
                    src={getImageUrl('/img/barber_logo.png')}
                    alt="Foto de Perfil"
                    width={40}
                    height={40}
                    />
                        ) :
                        <UserInitialsAvatar 
                            name={truncateText(user?.name?.toLocaleUpperCase(), 16)} 
                            size={40}
                            profileImage={user?.profileImage}
                            userId={user?.id}
                        />
                    }

                    <span className="hidden lg:flex">{user?.name?.toUpperCase()}</span>
                </div>

                <ChevronsUpDownIcon className="hidden lg:flex"/>

            </Button>

            {openModalAccount && (
                <ModalAccountButton
                openModalAccount={openModalAccount}
                setOpenModalAccount={setOpenModalAccount}
                />
                )}
        </div>
    )
}