import { Button } from "@/components/ui/button";
import { useBarbersContext } from "@/lib/context/BarbersContext";

interface ToggleButtonProps {
  active: boolean;
  onToggle: () => void;
  id: string
}

export const ToggleButton = ({ active, onToggle, id }: ToggleButtonProps) => {
    const {refetchStatus} = useBarbersContext()

    const handleClickToggle = () => {
        onToggle()
        refetchStatus(id)
        
    }
  return (
    <Button
      onClick={handleClickToggle}
      className={`relative rounded-full bg-zinc-900/80 w-8 h-4 transition-colors duration-300 ease-in-out`}
      aria-label={active ? "Desativar" : "Ativar"}
    >
      <span
        className={`absolute h-4 w-4 rounded-full bg-orange-500 transition-all duration-300 ease-in-out ${
          active ? "right-0" : "left-0"
        }`}
      ></span>
    </Button>
  );
};