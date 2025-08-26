import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { User, useUsersContext } from '@/lib/context/UserContext';
import { UserInitialsAvatar } from '@/app/_components/userInitialsAvatar';
import { AddUserToQueueModal } from '@/app/_components/modals/addUserToQueueModal';
import { useUsersInQueue } from '@/lib/hooks/useUsersInQueue';
import { motion } from 'framer-motion';

export const UserList = ({ user }: { user: User }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddToQueueModalOpen, setIsAddToQueueModalOpen] = useState(false);
  const { deleteUser } = useUsersContext();
  const { isUserInQueue } = useUsersInQueue();
  
  const userInQueue = isUserInQueue(user.id);

  const handleDelete = async () => {
    await deleteUser(user.id);
    setIsDeleteModalOpen(false); 
  };

  return (
    <>
      <motion.div 
        className="w-full flex items-center px-4 gap-6 justify-between border-b pb-2 mb-2 border-zinc-500/60"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ 
          scale: 1.02,
          backgroundColor: 'rgba(39, 39, 42, 0.8)',
          borderColor: 'rgba(251, 146, 60, 0.3)'
        }}
      >
        <motion.span 
          className={`w-2 h-2 rounded-full ${
            userInQueue 
              ? 'bg-red-400 animate-pulse-glow-red' 
              : 'bg-green-400 animate-pulse-glow-green'
          }`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: userInQueue ? 1.5 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        ></motion.span>
        
        <div className="flex items-center gap-3 flex-1">
          <UserInitialsAvatar 
            name={user.name} 
            size={40} 
            className="bg-orange-500 border-2 border-orange-500/30"
            profileImage={user.profileImage}
            userId={user.id}
          />
          <span>{user.name}</span>
        </div>
        
        <span className="w-72 text-orange-500">{user.phone}</span>

        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() => setIsAddToQueueModalOpen(true)}
              disabled={userInQueue}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                userInQueue
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-green-600 hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/25'
              }`}
              title={userInQueue ? 'Usuário já está na fila' : 'Adicionar à fila'}
            >
              <motion.div
                animate={userInQueue ? {} : { rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: userInQueue ? 0 : Infinity, ease: "linear" }}
              >
                <PlusIcon className="w-5 h-5" />
              </motion.div>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-red-700 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.3 }}
              >
                <Trash2Icon className="w-5 h-5" />
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Modal de Adicionar à Fila */}
      {!userInQueue && (
        <AddUserToQueueModal
          isOpen={isAddToQueueModalOpen}
          onClose={() => setIsAddToQueueModalOpen(false)}
          user={user}
          onSuccess={() => {
            // Aqui você pode adicionar lógica adicional se necessário
            console.log(`${user.name} foi adicionado à fila`);
          }}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-zinc-800 text-white border-zinc-700">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja excluir o usuário <strong>{user.name}</strong>? Essa ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-zinc-600 hover:bg-zinc-500"
            >
              Não
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-500"
            >
              Sim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};