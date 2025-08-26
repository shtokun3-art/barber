import { useAuth } from "@/lib/AuthContext";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getProfileImageUrl } from "@/lib/imageUtils";

interface UserInitialsAvatarProps {
  name: string | undefined;
  size?: number;
  className?: string;
  profileImage?: string | null;
  userId?: string; // Para garantir que a imagem seja específica do usuário
}

export const UserInitialsAvatar = ({ name, size, className, profileImage, userId }: UserInitialsAvatarProps) => {
  const { user } = useAuth();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const initials = useMemo(() => {
    if (!name) {
      return "";
    }
    const nameParts = name.trim().split(/\s+/);
    const firstInitial = nameParts[0]?.charAt(0) || "";
    const secondInitial =
      nameParts.length > 1 ? nameParts[1]?.charAt(0) : nameParts[0]?.charAt(1) || "";
    return `${firstInitial}${secondInitial}`.toUpperCase();
  }, [name]);

  const userColor = user?.color || "bg-gray-500";
  
  // Determinar qual imagem mostrar baseado no userId para garantir especificidade
  const imageToShow = useMemo(() => {
    let rawImage: string | null | undefined;
    
    if (userId && user?.id === userId) {
      // Se é o próprio usuário, usar a imagem do contexto ou a passada por prop
      rawImage = profileImage || user?.profileImage;
    } else if (userId && user?.id !== userId) {
      // Se é outro usuário, usar apenas a imagem passada por prop
      rawImage = profileImage;
    } else {
      // Fallback para compatibilidade
      rawImage = profileImage || user?.profileImage;
    }
    
    return getProfileImageUrl(rawImage);
  }, [profileImage, user?.profileImage, user?.id, userId]);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  if (imageToShow && !imageError) {
    return (
      <div
        className={`rounded-full overflow-hidden relative ${className}`}
        style={{ width: size, height: size }}
        aria-label={`Avatar de ${name || "usuário"}`}
      >
        {imageLoading && (
          <div className={`absolute inset-0 flex items-center justify-center ${userColor}`}>
            <Loader2 
              className="animate-spin text-white" 
              size={size ? Math.min(size / 3, 24) : 16}
            />
          </div>
        )}
        <img 
          src={imageToShow} 
          alt={`Avatar de ${name || "usuário"}`}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-semibold ${userColor} ${className}`}
      style={{ width: size, height: size, fontSize: size! / 3 }}
      aria-label={`Avatar de ${name || "usuário"} com as iniciais ${initials}`}
    >
      {initials}
    </div>
  );
};