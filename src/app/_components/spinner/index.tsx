import { twMerge } from "tailwind-merge";

export const Spinner = ({border='border-orange-500', size='w-6 h-6', ...rest}: {className?:string, border?:string, size?:string}) => {
    return (
      <div className={twMerge("flex justify-center items-center", rest.className)}>
        <div className={`${size} border-4 ${border} border-t-transparent rounded-full animate-spin shadow-glow`}></div>
      </div>
    );
  };
