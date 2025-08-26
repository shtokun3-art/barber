import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDownIcon } from "lucide-react";

interface Barber {
  id: string;
  name: string;
  status: string;
}

interface BarberSelectorProps {
  barbers: Barber[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

export const BarberSelector = ({
  barbers,
  value,
  onChange,
  placeholder = "Selecione um Barbeiro",
  searchPlaceholder = "Procurar Barbeiros...",
  className,
}: BarberSelectorProps) => {
  const [open, setOpen] = useState(false);

  const activeBarbers = barbers.filter((barber) => barber.status === "active");

  useEffect(() => {
    if (activeBarbers.length > 0) {
      const isCurrentValueActive = activeBarbers.some((barber) => barber.id === value);
      if (!isCurrentValueActive) {
        onChange(activeBarbers[0].id);
      }
    } else {
      onChange(null);
    }
  }, [activeBarbers, value, onChange]);

  const selectedBarber = activeBarbers.find((barber) => barber.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between bg-zinc-900 text-white border-zinc-700 rounded-md py-2 px-3 text-sm font-normal hover:bg-zinc-950 cursor-pointer ${className}`}
        >
          <span>{selectedBarber ? selectedBarber.name : placeholder}</span>
          <ChevronDownIcon className="h-4 w-4 text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 bg-zinc-900 border-zinc-600 border shadow-md rounded-md w-full">
        <Command>
          <div className="flex items-center border-b border-gray-200 px-1">
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-9 border-0 p-0 focus:ring-0 text-white text-sm"
            />
          </div>
          <CommandList>
            <CommandEmpty className="py-2 text-center text-white text-sm">
              Nenhum Barbeiro Encontrado
            </CommandEmpty>
            <CommandGroup>
              {activeBarbers.map((barber) => (
                <CommandItem
                  key={barber.id}
                  value={barber.name}
                  onSelect={() => {
                    onChange(barber.id === value ? null : barber.id);
                    setOpen(false);
                  }}
                  className="py-2 px-3 text-white text-sm hover:bg-zinc-950/60 cursor-pointer"
                >
                  <span>{barber.name}</span>
                  <Check
                    className={`ml-auto h-4 w-4 text-green-500 ${
                      value === barber.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};