import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ButtonComp } from '../buttonPattern';
import { Spinner } from '../spinner';
import { useItemsContext } from '@/lib/context/ItemsContext';

export const AddNewItem = () => {
  const [itemName, setItemName] = useState<string>('');
  const [itemValue, setItemValue] = useState<string>('');
  const [qtd, setQtd] = useState<string>(''); 
  const [error, setError] = useState<string | null>(null);

  const { addItem, loading, refetch } = useItemsContext();

  const handleOnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    refetch();

    const formattedName = itemName
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();

    const value = parseFloat(itemValue);
    const quantity = parseInt(qtd);

    if (formattedName.length < 2) {
      setError('O nome do item deve ter pelo menos 2 caracteres');
      return;
    }
    if (isNaN(value) || value <= 0) {
      setError('O valor deve ser um número positivo');
      return;
    }
    if (isNaN(quantity) || quantity < 0) {
      setError('A quantidade em estoque deve ser um número não negativo');
      return;
    }

    try {
      await addItem(formattedName, value, quantity);
      setItemName('');
      setItemValue('');
      setQtd(''); 
      setError(null);
    } catch (err) {
      setError('Erro ao adicionar item. Tente novamente.');
    }
  };

  return (
    <form
      onSubmit={handleOnSubmit}
      className="flex flex-col gap-4 max-h-[50%] max-w-[45%] min-w-[40%] items-center bg-zinc-800 p-4 rounded-lg"
    >
      <h1 className="text-xl font-bold mb-6">Adicionar Um Novo Item</h1>

      <Input
        value={itemName}
        onChange={(e) => {
          setItemName(e.target.value);
          setError(null);
        }}
        placeholder="Nome do Item"
        disabled={loading}
      />

      <div className='flex gap-6'>

        <Input
            type="number"
            value={itemValue}
            onChange={(e) => {
            setItemValue(e.target.value);
            setError(null);
            }}
            placeholder="Valor do Item"
            disabled={loading}
            step="0.01"
        />

        <Input
            type="number"
            value={qtd}
            onChange={(e) => {
            setQtd(e.target.value);
            setError(null);
            }}
            placeholder="Quantidade em Estoque"
            disabled={loading}
            min="0"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <ButtonComp.root
      type='submit'
        className="relative"
        disable={itemName.length < 2 || !itemValue || !qtd || loading}
      >
        {loading ? <Spinner className="w-4 h-4" /> : 'Adicionar'}
      </ButtonComp.root>
    </form>
  );
};