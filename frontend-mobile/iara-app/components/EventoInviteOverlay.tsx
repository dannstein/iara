import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Colors } from '../constants/theme';
import { setHasInvite, loadSeenEventoIds, markEventoIdSeen, getSeenEventoIds } from '../lib/inviteState';

// ── Tipos ─────────────────────────────────────────────────────

interface PendingInvite {
  eventoId: string;
  titulo: string;
  tipoNome: string;
  severidade: string;
}

// ── Constantes ────────────────────────────────────────────────

const ROTAS_EXCLUIDAS = [
  '/', '/signup', '/triagem', '/signup-doador',
  '/signup-voluntario', '/mapa-fullscreen',
];

const SEVERIDADE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  CRITICA: { color: '#DC2626', bg: '#FEE2E2', label: 'Crítico' },
  ALTA:    { color: '#C2410C', bg: '#FFEDD5', label: 'Alto'    },
  MEDIA:   { color: '#A16207', bg: '#FEF9C3', label: 'Médio'   },
  BAIXA:   { color: '#166534', bg: '#DCFCE7', label: 'Baixo'   },
};

// ── Componente ────────────────────────────────────────────────

export function EventoInviteOverlay() {
  const { accessToken, role } = useAuth();
  const pathname = usePathname();

  const [invite, setInvite] = useState<PendingInvite | null>(null);
  // ready=true após carregar os IDs persistidos — evita mostrar invite já visto
  const [ready, setReady] = useState(false);
  const pcIdRef  = useRef<string | null>(null);
  const seenIds  = useRef<Set<string>>(new Set());

  // Sincroniza seenIds com o módulo compartilhado após o load do AsyncStorage
  useEffect(() => {
    loadSeenEventoIds().then(() => {
      seenIds.current = new Set(getSeenEventoIds());
      setReady(true);
    });
  }, []);

  useEffect(() => {
    // Só inicia após carregar os IDs persistidos E ter token de COORDENADOR
    if (!ready || role !== 'COORDENADOR' || !accessToken) return;

    const headers = { Authorization: `Bearer ${accessToken}` };

    async function checkInvites() {
      try {
        // Busca PC apenas uma vez por sessão — apenas COORDENADORs COM PC recebem o popup
        if (!pcIdRef.current) {
          const meRes  = await api.get('/usuarios/me', { headers });
          const userId = meRes.data.id as string;
          const pcsRes = await api.get('/pontos-coleta', { headers });
          const myPc   = (pcsRes.data as any[]).find((p) => p.coordenadorId === userId);
          if (!myPc) return; // coordenador sem PC — silencioso
          pcIdRef.current = myPc.id;
        }

        const [pcEventosRes, eventosRes] = await Promise.all([
          api.get(`/pontos-coleta/${pcIdRef.current}/eventos`, { headers }),
          api.get('/eventos', { headers }).catch(() => ({ data: [] })),
        ]);

        const pending = (pcEventosRes.data as any[]).filter(
          (pe) => pe.status === 'NOTIFICADO' && !seenIds.current.has(pe.eventoId),
        );

        if (pending.length > 0) {
          const first  = pending[0];
          const evento = (eventosRes.data as any[]).find((e) => e.id === first.eventoId);
          // Marca como visto ANTES de renderizar — persiste para próximas sessões
          markEventoIdSeen(first.eventoId);
          seenIds.current.add(first.eventoId);
          setHasInvite(true);
          setInvite({
            eventoId: first.eventoId,
            titulo:    evento?.titulo    ?? 'Novo evento',
            tipoNome:  evento?.tipoNome  ?? 'Evento',
            severidade: evento?.severidade ?? 'MEDIA',
          });
        }
      } catch {}
    }

    checkInvites();
    const interval = setInterval(checkInvites, 60_000);
    return () => clearInterval(interval);
  }, [ready, role, accessToken]);

  // Esconde durante rotas de onboarding
  if (!invite) return null;
  if (ROTAS_EXCLUIDAS.includes(pathname)) return null;

  const sev = SEVERIDADE_STYLE[invite.severidade] ?? SEVERIDADE_STYLE.MEDIA;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => { setInvite(null); setHasInvite(false); }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="alert-circle-outline" size={22} color="#C2410C" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{invite.tipoNome} na sua área</Text>
              <Text style={styles.headerSub}>Convite de vinculação</Text>
            </View>
          </View>

          {/* Corpo */}
          <View style={styles.body}>
            <Text style={styles.eventoNome} numberOfLines={2}>{invite.titulo}</Text>
            <View style={[styles.sevBadge, { backgroundColor: sev.bg }]}>
              <Text style={[styles.sevText, { color: sev.color }]}>{sev.label}</Text>
            </View>
          </View>

          {/* Rodapé */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.detalhesBtn}
              onPress={() => {
                const id = invite.eventoId;
                setInvite(null);
                setHasInvite(false);
                router.push({ pathname: '/evento-detalhe', params: { id } } as never);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="eye-outline" size={16} color="#fff" />
              <Text style={styles.detalhesBtnText}>Ver detalhes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dispensarBtn}
              onPress={() => { setInvite(null); setHasInvite(false); }}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={16} color="#64748B" />
              <Text style={styles.dispensarText}>Dispensar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Estilos ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.blue.dark },
  headerSub:   { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  body:      { padding: 20, gap: 8 },
  eventoNome:{ fontSize: 17, fontWeight: '800', color: '#1E293B' },
  sevBadge:  { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  sevText:   { fontSize: 12, fontWeight: '700' },

  footer: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  detalhesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.blue.dark,
    borderRadius: 14,
    paddingVertical: 14,
  },
  detalhesBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  dispensarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dispensarText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
});
