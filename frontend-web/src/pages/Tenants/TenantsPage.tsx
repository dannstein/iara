import { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, Landmark, MapPin, Plus } from 'lucide-react';
import {
  SectionHeader,
  Card,
  LoadingBlock,
  ErrorState,
  Badge,
  Button,
} from '@/components/ui';
import {
  useTenantHierarquia,
  useTenantDetalhe,
  type TenantNodeDTO,
} from '@/hooks/useTenants';
import { useMe, useTenant } from '@/hooks/useUsuarios';
import { useAuthStore } from '@/store/authStore';
import { NovoTenantModal } from './NovoTenantModal';
import { SearchInput } from '@/components/SearchInput';
import { cn } from '@/lib/utils';

const TIPO_META: Record<
  TenantNodeDTO['tipo'],
  { label: string; color: string; chip: string; icon: typeof Building2 }
> = {
  FEDERAL: { label: 'Federal', color: '#3B82F6', chip: 'bg-blue-500/12 text-blue-400 border-blue-500/30', icon: Landmark },
  ESTADUAL: { label: 'Estadual', color: '#8B5CF6', chip: 'bg-purple-500/12 text-purple-400 border-purple-500/30', icon: Building2 },
  MUNICIPAL: { label: 'Municipal', color: '#22C55E', chip: 'bg-green-500/12 text-green-400 border-green-500/30', icon: MapPin },
};

function countNodes(node: TenantNodeDTO): number {
  return 1 + node.filhos.reduce((acc, f) => acc + countNodes(f), 0);
}

export function TenantsPage() {
  const { data: root, isLoading, isError } = useTenantHierarquia();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [novoOpen, setNovoOpen] = useState(false);
  const [search, setSearch] = useState('');
  const role = useAuthStore((s) => s.user?.role);
  const me = useMe();
  const meuTenant = useTenant(me.data?.tenantId);
  // ADMIN ou gestor federal/estadual podem criar tenants; municipal não.
  const canCreate =
    role === 'ADMIN' || meuTenant.data?.tipo === 'FEDERAL' || meuTenant.data?.tipo === 'ESTADUAL';

  if (isLoading) return <LoadingBlock />;
  if (isError || !root) return <ErrorState />;

  const total = countNodes(root);
  const scopeNote =
    role === 'ADMIN'
      ? 'Como ADMIN, você vê e acessa todos os tenants do sistema.'
      : `Você está vinculado a ${root.nome} (${TIPO_META[root.tipo].label}) e vê este tenant e seus subordinados.`;

  return (
    <div>
      <SectionHeader
        eyebrow="Gestão"
        title="Tenants"
        action={
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-ink-muted">{total} no seu escopo</span>
            {canCreate && (
              <Button onClick={() => setNovoOpen(true)}>
                <Plus size={15} /> Novo Tenant
              </Button>
            )}
          </div>
        }
      />

      <NovoTenantModal open={novoOpen} onClose={() => setNovoOpen(false)} />

      <div className="mb-5 rounded-lg border border-white/[0.06] bg-bg-secondary px-4 py-3 text-[12px] text-ink-secondary">
        {scopeNote}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Árvore */}
        <Card className="xl:col-span-2">
          <SectionHeader
            eyebrow="Hierarquia"
            title="Estrutura de tenants"
            action={
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar tenant…" className="w-48" />
            }
          />
          {search ? (
            <TenantSearchResults root={root} search={search} selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <div className="flex flex-col">
              <TreeNode node={root} depth={0} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          )}
        </Card>

        {/* Detalhe */}
        <Card>
          <SectionHeader eyebrow="Detalhe" title="Tenant selecionado" />
          {selectedId ? (
            <TenantDetail id={selectedId} />
          ) : (
            <p className="py-8 text-center text-[12px] text-ink-muted">
              Selecione um tenant na árvore para ver seus dados.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function flattenTree(node: TenantNodeDTO, acc: TenantNodeDTO[] = []): TenantNodeDTO[] {
  acc.push(node);
  node.filhos.forEach((f) => flattenTree(f, acc));
  return acc;
}

function TenantSearchResults({
  root,
  search,
  selectedId,
  onSelect,
}: {
  root: TenantNodeDTO;
  search: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const matches = flattenTree(root).filter((n) =>
    n.nome.toLowerCase().includes(search.toLowerCase()),
  );
  if (matches.length === 0) {
    return <p className="py-6 text-center text-[12px] text-ink-muted">Nenhum tenant encontrado.</p>;
  }
  return (
    <div className="flex flex-col">
      {matches.map((n) => {
        const meta = TIPO_META[n.tipo];
        const Icon = meta.icon;
        const isSelected = selectedId === n.id;
        return (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors',
              isSelected ? 'bg-brand-blue-soft' : 'hover:bg-white/[0.03]',
            )}
          >
            <Icon size={15} style={{ color: meta.color }} className="flex-shrink-0" />
            <span className={cn('truncate text-[13px]', isSelected ? 'text-white' : 'text-ink-primary')}>
              {n.nome}
            </span>
            <Badge className={cn('ml-1 border', meta.chip)}>{meta.label}</Badge>
            {n.uf && <span className="text-[11px] text-ink-muted">{n.uf}</span>}
          </button>
        );
      })}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: TenantNodeDTO;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const meta = TIPO_META[node.tipo];
  const Icon = meta.icon;
  const hasChildren = node.filhos.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={cn(
          'group flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pr-2 transition-colors',
          isSelected ? 'bg-brand-blue-soft' : 'hover:bg-white/[0.03]',
        )}
        style={{ paddingLeft: depth * 18 + 4 }}
        onClick={() => onSelect(node.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setOpen((o) => !o);
          }}
          className={cn('flex h-5 w-5 items-center justify-center text-ink-muted', !hasChildren && 'invisible')}
          aria-label={open ? 'Recolher' : 'Expandir'}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <Icon size={15} style={{ color: meta.color }} className="flex-shrink-0" />
        <span className={cn('truncate text-[13px]', isSelected ? 'text-white' : 'text-ink-primary')}>
          {node.nome}
        </span>
        <Badge className={cn('ml-1 border', meta.chip)}>{meta.label}</Badge>
        {node.uf && <span className="text-[11px] text-ink-muted">{node.uf}</span>}
        {hasChildren && (
          <span className="ml-auto text-[11px] text-ink-muted">{node.filhos.length}</span>
        )}
      </div>
      {open &&
        node.filhos.map((f) => (
          <TreeNode key={f.id} node={f} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
        ))}
    </div>
  );
}

function TenantDetail({ id }: { id: string }) {
  const { data, isLoading, isError } = useTenantDetalhe(id);
  if (isLoading) return <LoadingBlock />;
  if (isError || !data) return <ErrorState description="Sem acesso a este tenant ou não encontrado." />;

  const meta = TIPO_META[data.tipo];
  const rows: [string, React.ReactNode][] = [
    ['Tipo', <Badge className={cn('border', meta.chip)}>{meta.label}</Badge>],
    ['UF', data.uf ?? '—'],
    ['Código IBGE', data.ibgeCod ? <span className="data-mono">{data.ibgeCod}</span> : '—'],
    ['Situação', data.isActive ? 'Ativo' : 'Inativo'],
    ['ID', <span className="data-mono text-[11px]">{data.id}</span>],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${meta.color}1A`, color: meta.color }}
        >
          <meta.icon size={18} />
        </div>
        <div>
          <p className="eyebrow">{meta.label}</p>
          <h3 className="text-[15px] font-semibold text-ink-primary">{data.nome}</h3>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/[0.06]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-white/[0.04] px-4 py-2.5 last:border-0">
            <span className="text-[12px] text-ink-muted">{k}</span>
            <span className="text-[13px] text-ink-primary">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
