
import { PageSelected } from "@/app/(pages)/main/[id]/page"
import { ButtonNavigationBar } from "./buttonNavigationBar"
import { CalendarClock, Clock, Home, PanelBottom, Settings2Icon, UserCheckIcon } from "lucide-react"
import { twMerge } from "tailwind-merge"
import Image from "next/image"
import { ButtonAccount } from "../../buttonAccount"
import { useQueue } from "@/lib/hooks/useQueue"
import { getImageUrl } from "@/lib/imageUtils"

interface NavBarMainPageProps {
    page: PageSelected
    setPage: (val: PageSelected) => void
    className?: string
}

export const NavBarMainPage = ({page, setPage, ...rest}:NavBarMainPageProps) => {

    const {queueEntries} = useQueue()

    return(
        <nav
        className={twMerge(`flex items-center justify-between flex-col min-w-[250px] gap-3 lg:gap-4 w-full glass-sidebar py-4 lg:py-6 h-full px-4 lg:px-6 relative z-10`, rest.className)}
        >   
            <div className="w-full flex items-center flex-col gap-4">
                <Image
                src={getImageUrl('/img/barber_logo.png')}
                alt="Logo da Barbearia"
                width={80}
                height={80}
                className="mb-6 lg:mb-10 lg:w-[100px] lg:h-[100px]"
                />


                <ButtonNavigationBar ord="dashboard" page={page}
                onClick={() => setPage('dashboard')}
                >
                    <PanelBottom/>
                    Painel
                </ButtonNavigationBar>

                <ButtonNavigationBar ord="queue" page={page} notify={queueEntries.length}
                onClick={() => setPage("queue")}
                >
                    <Clock/>
                    Fila
                </ButtonNavigationBar>

                <ButtonNavigationBar ord="clients" page={page}
                onClick={() => setPage("clients")}
                >
                    <UserCheckIcon/>
                    Clientes
                </ButtonNavigationBar>

                <ButtonNavigationBar ord="settings" page={page}
                onClick={() => setPage("settings")}
                className="hidden lg:flex"
                >
                    <Settings2Icon/>
                    Configurações
                </ButtonNavigationBar>
                

                <ButtonNavigationBar ord="history" page={page}
                onClick={() => setPage('history')}
                >
                    <CalendarClock/>
                    Histórico
                </ButtonNavigationBar>
            </div>



            <ButtonAccount className="hidden lg:w-full lg:flex"/>
            

        </nav>
    )
}