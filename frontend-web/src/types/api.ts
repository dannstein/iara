// Tipos do contrato da API IARA (handout_doc.md). Apenas o necessário para
// a fundação + páginas core; expandir conforme novas telas forem criadas.

export type Role =
  | 'ADMIN'
  | 'GESTOR'
  | 'MONITOR'
  | 'COORDENADOR'
  | 'TECNICO'
  | 'DOADOR'
  | 'USUARIO_SIMPLES';

export type Severidade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type EventoStatus =
  | 'SOLICITADO'
  | 'ATIVO'
  | 'ALERTA_CRITICO'
  | 'ENCERRADO'
  | 'CANCELADO';
export type FideStatus =
  | 'NAO_INICIADO'
  | 'EM_PREENCHIMENTO'
  | 'SUBMETIDO'
  | 'APROVADO'
  | 'REJEITADO';
export type Classificacao = 'VERMELHO' | 'AMARELO' | 'VERDE' | 'PRETO';
export type PcTipo = 'FIXO' | 'TEMPORARIO';
export type DemandaPrioridade = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'SUPRIDA';
export type CadastroStatus = 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'BLOQUEADO' | 'ATIVO';

export interface Coordenadas {
  lat: number;
  lng: number;
}

export type GeoJsonGeometry = {
  type: string;
  coordinates: unknown;
};

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresAt: number;
  userId: string;
  email: string;
  role: Role;
}

export interface ApiError {
  timestamp: string;
  status: number;
  erro: string;
  mensagem: string;
  path: string;
  campos?: Record<string, string>;
  priority_blocked?: boolean;
}

export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  documento: string | null;
  role: Role;
  tenantId: string;
  especId: string | null;
  cadastroSts: CadastroStatus;
  estaDisponivel: boolean;
  fotoUrl: string | null;
  docComprovacaoNumero: string | null;
  docComprovacaoUrl: string | null;
  createdAt: string;
}

export interface EventoDTO {
  id: string;
  tenantId: string;
  titulo: string;
  descricao: string | null;
  idTipo: string;
  tipoNome: string;
  status: EventoStatus;
  severidade: Severidade;
  solicitanteId: string;
  aprovadorId: string | null;
  coordenadas: Coordenadas;
  raioMetros: number | null;
  areaRisco: GeoJsonGeometry | null;
  isSimulado: boolean;
  cobradeCod: string | null;
  fideStatus: FideStatus;
  upvotes: number;
  dataSolicitacao: string;
  dataAprovacao: string | null;
}

export interface IncidentesDTO {
  id: string;
  eventoId: string;
  mortos: number;
  feridos: number;
  desabrigados: number;
  desaparecidos: number;
  startVermelho: number;
  startAmarelo: number;
  startVerde: number;
  startPreto: number;
  createdAt: string;
}

export interface TriagemDTO {
  id: string;
  codigoCampo: string;
  nomeProvisorio: string | null;
  idadeEstimada: number | null;
  classificacao: Classificacao;
  respiraAposAbertura: boolean | null;
  localEncontrado: Coordenadas | null;
  setorId: string | null;
  triadorId: string;
  createdAt: string;
}

export interface HistoricoDTO {
  id: string;
  statusDe: EventoStatus | null;
  statusPara: EventoStatus;
  responsavelId: string;
  observacao: string | null;
  createdAt: string;
}

export interface CheckinDTO {
  id: string;
  eventoId: string;
  usuarioId: string;
  coordenadas: Coordenadas | null;
  dataCheckin: string;
  dataCheckout: string | null;
}

export interface CriarEventoInput {
  titulo: string;
  descricao?: string;
  idTipo: string;
  severidade: Severidade;
  coordenadas: Coordenadas;
  raioMetros?: number;
  cobradeCod?: string;
  isSimulado?: boolean;
}

export interface CriarDemandaInput {
  idEvento: string;
  idTipo: string;
  prioridade?: DemandaPrioridade;
  qtdSolicitada: number;
  descricao?: string;
}

export interface FideDTO {
  cobradeCod: string | null;
  municipioAfetado: string | null;
  decretoMunicipal: string | null;
  dataDecreto: string | null;
  popAfetada: number | null;
  danosMateriais: string | null;
  acoesResposta: string | null;
  recursosSolicitados: string | null;
  prejuizoPublico: number | null;
  prejuizoPrivado: number | null;
  danosHumanosDesc: string | null;
  fideStatus: FideStatus;
}

export interface PcDTO {
  id: string;
  tenantId: string;
  coordenadorId: string;
  pcNome: string;
  pcTipo: PcTipo;
  coordenadas: Coordenadas;
  pcDesc: string | null;
  pcContato: string | null;
  pcIsVerified: boolean;
  isActive: boolean;
}

export interface DemandaDTO {
  id: string;
  pcId: string;
  eventoId: string;
  idTipo: string;
  tipoNome: string;
  prioridade: DemandaPrioridade;
  qtdSolicitada: number;
  qtdAtendida: number;
  descricao: string | null;
  isActive: boolean;
}

export interface EstoqueDTO {
  id: string;
  idTipo: string;
  tipoNome: string;
  quantidade: number;
}

export interface AbrigoDTO {
  id: string;
  tenantId: string;
  eventoId: string | null;
  nome: string;
  descricao: string | null;
  coordenadas: Coordenadas;
  capacidadeTotal: number;
  ocupacaoAtual: number;
  contato: string | null;
  isActive: boolean;
}

export interface OcupanteDTO {
  id: string;
  abrigoId: string;
  nome: string;
  documento: string | null;
  idade: number | null;
  isIdoso: boolean;
  isCrianca: boolean;
  isPcd: boolean;
  isGestante: boolean;
  isPrioridade: boolean;
  necessidadeEspecialTipo: string | null;
  dataEntrada: string;
  dataSaida: string | null;
}

export interface AlertaDTO {
  id: string;
  idEvento: string | null;
  idTipo: string;
  tipoNome: string;
  mensagem: string;
  areaAlerta: GeoJsonGeometry | null;
  emissorId: string;
  createdAt: string;
}

export type HospitalTipo = 'PUBLICO' | 'PRIVADO' | 'MISTO' | 'CAMPANHA';

export interface HospitalDTO {
  id: string;
  tenantId: string;
  nome: string;
  cnes: string | null;
  tipo: HospitalTipo;
  coordenadas: Coordenadas;
  contato: string | null;
  leitosTotal: number | null;
  leitosDisponiveis: number | null;
  leitosUti: number | null;
  leitosUtiDisp: number | null;
  aceitaCampanha: boolean;
  isActive: boolean;
}

export type ZonaTipo = 'ENCHENTE' | 'DESLIZAMENTO' | 'INCENDIO' | 'MULTIPERIGO' | 'OUTRO';

export interface PontoApoioDTO {
  id: string;
  tenantId: string;
  nome: string;
  descricao: string | null;
  coordenadas: Coordenadas;
  contato: string | null;
  responsavel: string | null;
  enderecoTxt: string | null;
  zonaRiscoId: string | null;
  zonaRiscoNome: string | null;
  isActive: boolean;
}

export interface ApoioRef {
  id: string;
  nome: string;
}

export interface ZonaRiscoDTO {
  id: string;
  tenantId: string;
  nome: string;
  descricao: string | null;
  tipo: ZonaTipo;
  geometria: GeoJsonGeometry | null;
  coordenadas: Coordenadas | null;
  raioMetros: number | null;
  nivelRisco: number;
  fonte: string | null;
  dataMapeamento: string | null;
  apoios: ApoioRef[];
  situacaoApoio: 'SEM_APOIO' | 'COM_APOIO';
  isActive: boolean;
}

export type SolicitacaoStatus =
  | 'ABERTA'
  | 'EM_TRIAGEM'
  | 'EM_ATENDIMENTO'
  | 'CONCLUIDA'
  | 'INDEFERIDA';
export type SolicitacaoTipo =
  | 'CORTE_ARVORE'
  | 'VISTORIA_RACHADURA'
  | 'LIMPEZA_BUEIRO'
  | 'RISCO_DESLIZAMENTO'
  | 'OUTRO';

export interface SolicitacaoServicoDTO {
  id: string;
  usuarioId: string;
  tenantId: string;
  tipo: SolicitacaoTipo | string;
  enderecoTxt: string;
  geometria: Coordenadas | null;
  descricaoMotivo: string;
  fotosUrls: { url: string; ordem: number }[];
  status: SolicitacaoStatus;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | null;
  responsavelId: string | null;
  observacaoDc: string | null;
  pdfUrls: string[];
  createdAt: string;
}

export interface SolicitacaoHistoricoDTO {
  id: string;
  statusPara: SolicitacaoStatus;
  observacao: string | null;
  responsavelId: string | null;
  createdAt: string;
}

export interface NotificacaoDTO {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'EVENTO' | 'DEMANDA' | 'ALERTA' | 'PC' | 'METEOROLOGICO' | 'SISTEMA';
  idRef: string | null;
  lida: boolean;
  createdAt: string;
}

export interface EspecDTO {
  id: string;
  idCategoria: string;
  nome: string;
  descricao: string | null;
  idTenant: string | null;
}

export interface CategoriaDTO {
  id: string;
  nome: string;
  descricao: string | null;
  idTenant: string | null;
  subcategorias: EspecDTO[] | null;
}

export interface AtendimentoDTO {
  eventoId: string;
  eventoTitulo: string;
  severidade: Severidade;
  checkins: number;
  triagens: number;
  primeiroCheckin: string | null;
  ultimoCheckout: string | null;
}

export interface LookupItem {
  id: string;
  nome: string;
  descricao: string | null;
  cobradeCod?: string;
}

// Dashboards (§18) — agregados
export type DashboardEventos = Record<string, number> & { total: number };
export interface DashboardIncidentes {
  mortos: number;
  feridos: number;
  desabrigados: number;
  desaparecidos: number;
  start_vermelho: number;
  start_amarelo: number;
  start_verde: number;
  start_preto: number;
}
export interface DashboardAbrigos {
  abrigos: number;
  ocupacao_total: number;
  capacidade_total: number;
}
export interface DashboardPcs {
  pcs_ativos: number;
  demandas_pendentes: number;
}
export interface DashboardTecnicos {
  tecnicos_disponiveis: number;
}
export type DashboardDoacoes = Record<string, number>;
export interface DashboardPontosAtencao {
  SEM_APOIO: number;
  COM_APOIO: number;
}
