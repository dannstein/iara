import { useState } from 'react';
import { toast } from 'sonner';
import { Stethoscope } from 'lucide-react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { useCategorias, useCriarCategoria, useCriarEspec } from '@/hooks/useEspecialidades';
import { apiErrorMessage } from '@/lib/api';

type Modo = 'espec' | 'categoria';

export function NovaEspecialidadeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categorias } = useCategorias();
  const criarCategoria = useCriarCategoria();
  const criarEspec = useCriarEspec();

  const [modo, setModo] = useState<Modo>('espec');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [idCategoria, setIdCategoria] = useState('');

  function close() {
    setNome('');
    setDescricao('');
    setIdCategoria('');
    setModo('espec');
    onClose();
  }

  function salvar() {
    if (!nome.trim()) return;
    if (modo === 'categoria') {
      criarCategoria.mutate(
        { nome: nome.trim(), descricao: descricao || undefined },
        {
          onSuccess: () => {
            toast.success('Categoria criada.');
            close();
          },
          onError: (e) => toast.error(apiErrorMessage(e)),
        },
      );
    } else {
      if (!idCategoria) {
        toast.error('Selecione a categoria.');
        return;
      }
      criarEspec.mutate(
        { idCategoria, nome: nome.trim(), descricao: descricao || undefined },
        {
          onSuccess: () => {
            toast.success('Especialidade criada.');
            close();
          },
          onError: (e) => toast.error(apiErrorMessage(e)),
        },
      );
    }
  }

  const pending = criarCategoria.isPending || criarEspec.isPending;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Nova especialidade"
      eyebrow="Voluntários"
      icon={<Stethoscope size={16} />}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={salvar} loading={pending} disabled={!nome.trim()}>
            Criar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-lg border border-white/10 p-0.5">
          {(['espec', 'categoria'] as Modo[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
                modo === m ? 'bg-brand-blue-soft text-white' : 'text-ink-muted hover:text-ink-secondary'
              }`}
            >
              {m === 'espec' ? 'Especialidade' : 'Categoria'}
            </button>
          ))}
        </div>

        {modo === 'espec' && (
          <FormField label="Categoria" required>
            <Select value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)}>
              <option value="" disabled>
                Selecione…
              </option>
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <FormField label="Nome" required>
          <Input
            placeholder={modo === 'espec' ? 'Ex.: Médico, Psicólogo' : 'Ex.: Saúde'}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </FormField>
        <FormField label="Descrição">
          <Input placeholder="Opcional" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
