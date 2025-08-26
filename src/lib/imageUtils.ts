/**
 * Utilitário para gerar URLs de imagens que funcionem em produção e desenvolvimento
 */

/**
 * Gera a URL correta para imagens estáticas
 * @param imagePath - Caminho da imagem (ex: '/img/barber_logo.png')
 * @returns URL completa da imagem
 */
export function getImageUrl(imagePath: string): string {
  // Remove a barra inicial se existir
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Usar sempre a API de imagens para garantir consistência entre servidor e cliente
  return `/api/images/${cleanPath}`;
}

/**
 * Gera a URL correta para imagens de perfil (base64 ou URL)
 * @param profileImage - String da imagem (base64 ou URL)
 * @returns URL processada da imagem
 */
export function getProfileImageUrl(profileImage: string | null | undefined): string | null {
  if (!profileImage) return null;
  
  // Se já é uma URL completa ou base64, retornar como está
  if (profileImage.startsWith('http') || profileImage.startsWith('data:')) {
    return profileImage;
  }
  
  // Se é um caminho relativo, processar como imagem estática
  return getImageUrl(profileImage);
}

/**
 * Verifica se uma string é uma imagem base64 válida
 * @param str - String para verificar
 * @returns true se for base64, false caso contrário
 */
export function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/');
}

/**
 * Converte uma imagem para base64 (para upload)
 * @param file - Arquivo de imagem
 * @returns Promise com a string base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}