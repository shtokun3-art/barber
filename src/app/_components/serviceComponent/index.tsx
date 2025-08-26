import { Button } from "@/components/ui/button"
import { useServicesContext } from "@/lib/context/servicesContext"
import { Service, useServices } from "@/lib/hooks/useServices"
import { CheckCheckIcon, Edit2Icon, Trash2Icon } from "lucide-react"

interface ServiceComponentProps {
    service: Service
    value: string
    time: number
}

export const ServiceComponent = ({service, value, time}:ServiceComponentProps) => {

    const {deleteService, refetch} = useServicesContext()

    const handleDeleteService = () => {
        deleteService(service.id)
        refetch()
    }

    return(
        <div
            className="border-b border-b-zinc-700/60 gap-4 px-4 py-2 rounded-lg flex justify-between items-center cursor-pointer duration-200 ease-in-out hover:bg-zinc-700/80"
            >
                <span className=" flex-1 duration-200 ease-in-out hover:text-orange-500">{service.name}</span>
                <span className="text-green-600 font-bold w-20">{value}</span>
                <span className="w-12">{time} m</span>

                <Button
                onClick={handleDeleteService}
                className="bg-red-700 w-12 cursor-pointer duration-200 ease-in-out hover:bg-red-700/60"
                >
                    <Trash2Icon/>
                </Button>
            </div>
    )
}