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

// ============================================================================
// Alertas (Fase 1)
// ============================================================================

export type AlertaSeveridade =
  | 'INFO'
  | 'WARNING'
  | 'DANGER'
  | 'CRITICAL'
  | 'EMERGENCY'
  | 'SOLICITATION'
  | 'OPERATIONAL';

export type AlertaStatus = 'ACTIVE' | 'EXPIRED' | 'RESOLVED' | 'CANCELLED' | 'SUPERSEDED';

export type AlertaCategoria =
  | 'DANGER_ZONE'
  | 'EVENT_ZONE'
  | 'TENANT_BROADCAST'
  | 'TECHNICAL_REQUEST'
  | 'SUPPORT_POINTS'
  | 'COLLECTION_POINTS'
  | 'MONITORS'
  | 'PERSONALIZED'
  | 'ESCALATION';

export type DeliveryStatus =
  | 'SENT'
  | 'DELIVERED'
  | 'VISUALIZED'
  | 'ACKNOWLEDGED'
  | 'RESPONDED'
  | 'FAILED';

export type AckResponse = 'ACCEPT' | 'REFUSE' | 'UNAVAILABLE';

export type GeofenceMode = 'INSIDE' | 'NEAR' | 'HOME' | 'WORK';

export interface AckSummaryDTO {
  sent: number;
  delivered: number;
  visualized: number;
  acknowledged: number;
  accepted: number;
  refused: number;
  unavailable: number;
  failed: number;
}

export interface AlertaDTO {
  id: string;
  tenantId: string;
  emissorId: string;
  idEvento: string | null;
  idZonaRisco: string | null;
  idTipo: string;
  tipoNome: string;
  titulo: string | null;
  mensagem: string;
  severidade: AlertaSeveridade;
  status: AlertaStatus;
  categoria: AlertaCategoria;
  targetRole: string | null;
  coordenadas: Coordenadas | null;
  raioMetros: number | null;
  areaAlerta: GeoJsonGeometry | null;
  geofenceModes: GeofenceMode[];
  dataExpiracao: string | null;
  autoExpireMinutes: number | null;
  dataResolvido: string | null;
  resolvedoPor: string | null;
  requerAck: boolean;
  ackMinimo: number | null;
  isEscalation: boolean;
  escalationMotivo: string | null;
  escalationFromTenant: string | null;
  totalDestinatarios: number;
  ackSummary: AckSummaryDTO | null;
  mergedCount: number;
  merged: boolean;
  createdAt: string;
}

export interface AlertaDestinatarioDTO {
  id: string;
  alertaId: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioRole: Role;
  deliveryStatus: DeliveryStatus;
  response: AckResponse | null;
  sentAt: string;
  deliveredAt: string | null;
  visualizedAt: string | null;
  acknowledgedAt: string | null;
  respondedAt: string | null;
  failureReason: string | null;
}

export interface AlertaDashboardDTO {
  ativos: number;
  criticosAtivos: number;
  acksPendentes: number;
  resolvidosHoje: number;
  porSeveridade: Record<string, number>;
  porCategoria: Record<string, number>;
}

export interface AlertaPreviewDTO {
  totalDestinatarios: number;
  porRole: Record<string, number>;
  porTenant: Record<string, number>;
  cooldownAtivo: boolean;
  existingAlertaId: string | null;
}

export interface AlertaTemplateDTO {
  categoria: AlertaCategoria;
  titulo: string;
  mensagem: string;
  placeholders: string[];
}

// --- Phase 2A: Scheduled Alerts ---

export type RecurrenceType = 'ONE_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface AlertaAgendadoDTO {
  id: string;
  tenantId: string;
  criadorId: string;
  nome: string;
  categoria: AlertaCategoria;
  payload: Record<string, unknown>;
  tipoRecorrencia: RecurrenceType;
  inicio: string;
  fim: string | null;
  horario: string | null;
  diaSemana: number | null;
  diaMes: number | null;
  intervaloHoras: number | null;
  isAtivo: boolean;
  ultimaExecucao: string | null;
  proximaExecucao: string;
  totalDisparos: number;
  ultimoErro: string | null;
  createdAt: string;
}

export interface CreateAlertaAgendadoInput {
  nome: string;
  categoria: AlertaCategoria;
  payload: Record<string, unknown>;
  tipoRecorrencia: RecurrenceType;
  inicio: string;
  fim?: string;
  horario?: string;
  diaSemana?: number;
  diaMes?: number;
  intervaloHoras?: number;
}

// --- Create requests (one per category) ---

export interface CreateDangerZoneAlertInput {
  idZonaRisco?: string;
  todasZonas?: boolean;
  severidade: AlertaSeveridade;
  titulo?: string;
  mensagem?: string;
  geofenceModes: GeofenceMode[];
  raioMetros?: number;
  dataExpiracao?: string;
  autoExpireMinutes?: number;
  requerAck?: boolean;
}

export interface CreateEventZoneAlertInput {
  idEvento?: string;
  todosEventos?: boolean;
  severidade: AlertaSeveridade;
  titulo?: string;
  mensagem?: string;
  geofenceModes: GeofenceMode[];
  raioMetros?: number;
  dataExpiracao?: string;
  autoExpireMinutes?: number;
  requerAck?: boolean;
}

export interface CreateTenantBroadcastInput {
  idTenantAlvo: string;
  targetRole?: string;
  severidade: AlertaSeveridade;
  titulo?: string;
  mensagem: string;
  dataExpiracao?: string;
  autoExpireMinutes?: number;
}

export interface CreateTechnicalRequestInput {
  idEvento: string;
  especialidadeId?: string;
  raioMetros?: number;
  tenantWide?: boolean;
  titulo?: string;
  mensagem?: string;
  ackMinimo?: number;
  dataExpiracao?: string;
  autoExpireMinutes?: number;
}

export interface CreateSupportPointsInput {
  idZonaRisco: string;
  escopoTipo?: 'ZONA' | 'RAIO' | 'TENANT';
  raioMetros?: number;
  severidade: AlertaSeveridade;
  titulo?: string;
  mensagem?: string;
  dataExpiracao?: string;
  autoExpireMinutes?: number;
}

export interface CreateCollectionPointsInput {
  idEvento: string;
  escopoTipo?: 'EVENTO' | 'RAIO' | 'TENANT';
  raioMetros?: number;
  severidade: AlertaSeveridade;
  titulo?: string;
  mensagem?: string;
  dataExpiracao?: string;
  autoExpireMinutes?: number;
}

export interface CreateMonitorsInput {
  idEvento?: string;
  idZonaRisco?: string;
  escopoTipo?: 'RAIO' | 'TENANT';
  raioMetros?: number;
  severidade: AlertaSeveridade;
  titulo?: string;
  mensagem?: string;
  dataExpiracao?: string;
  autoExpireMinutes?: number;
}

export interface CreatePersonalizedInput {
  severidade: AlertaSeveridade;
  targetRole?: string;
  coordenadas?: Coordenadas;
  raioMetros?: number;
  geofenceModes?: GeofenceMode[];
  idEvento?: string;
  idZonaRisco?: string;
  idTenantAlvo?: string;
  titulo: string;
  mensagem: string;
  dataExpiracao?: string;
  autoExpireMinutes?: number;
  requerAck?: boolean;
}

export interface EscalateAlertInput {
  idTenantAlvo: string;
  severidade: 'DANGER' | 'CRITICAL' | 'EMERGENCY';
  motivo: string;
  titulo: string;
  mensagem: string;
  idEvento?: string;
  idZonaRisco?: string;
  dataExpiracao?: string;
  autoExpireMinutes?: number;
}

export interface AckInput {
  acao: 'ACKNOWLEDGE' | 'ACCEPT' | 'REFUSE' | 'UNAVAILABLE';
}

export interface AlertasFilter {
  status?: AlertaStatus;
  severidade?: AlertaSeveridade;
  categoria?: AlertaCategoria;
  id_evento?: string;
  id_zona_risco?: string;
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

// Monitoramento de usuários em risco (GET /usuarios/em-risco — GESTOR)
export interface UsuarioLocalizacaoDTO {
  id: string;
  nome: string;
  role: Role;
  telefone: string | null;
  localizacao: Coordenadas;
}

export interface ZonaComUsuariosDTO {
  zonaId: string;
  zonaNome: string;
  zonaTipo: ZonaTipo;
  nivelRisco: number;
  totalUsuarios: number;
  geometria: GeoJsonGeometry | null;
  usuarios: UsuarioLocalizacaoDTO[];
}

export interface EventoComUsuariosDTO {
  eventoId: string;
  eventoTitulo: string;
  severidade: Severidade;
  status: EventoStatus;
  raioMetros: number;
  coordenadas: Coordenadas;
  totalUsuarios: number;
  usuarios: UsuarioLocalizacaoDTO[];
}

export interface UsuariosEmRiscoDTO {
  totalUsuariosEmRisco: number;
  zonas: ZonaComUsuariosDTO[];
  eventos: EventoComUsuariosDTO[];
}
