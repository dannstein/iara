import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Modal,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../services/api';
import { useAppModal } from '../components/AppModal';

// Backend EspecDTO: { id, idCategoria, nome, descricao, idTenant }
interface EspecOption {
    id: string;
    nome: string;
}

export default function SignupVoluntario() {
    const { show, modal } = useAppModal();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [documento, setDocumento] = useState(""); // CPF
    const [senha, setSenha] = useState("");
    const [registro, setRegistro] = useState(""); // docComprovacaoNumero
    const [especialidade, setEspecialidade] = useState<EspecOption | null>(null);
    const [comprovante, setComprovante] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [especialidades, setEspecialidades] = useState<EspecOption[]>([]);
    const [especsLoading, setEspecsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetchEspecs() {
            try {
                const r = await api.get<{ id: string; nome: string }[]>('/especialidades');
                if (!cancelled) {
                    setEspecialidades(
                        [...r.data].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                    );
                }
            } catch (err) {
                console.error("Erro ao carregar especialidades:", err);
                if (!cancelled) {
                    show({
                        type: 'error',
                        title: 'Erro de conexão',
                        message: 'Não foi possível carregar a lista de especialidades. Verifique sua conexão.',
                    });
                }
            } finally {
                if (!cancelled) setEspecsLoading(false);
            }
        }
        fetchEspecs();
        return () => { cancelled = true; };
    }, []);

    async function handlePickDocument() {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setComprovante(result.assets[0]);
            }
        } catch (error) {
            console.error("Erro ao selecionar o comprovante:", error);
            show({ type: 'error', title: 'Erro', message: 'Ocorreu um erro ao tentar selecionar o comprovante.' });
        }
    }

    async function handleRegister() {
        if (!nome || !email || !telefone || !documento || !senha || !registro || !especialidade) {
            show({ type: 'warning', title: 'Campos obrigatórios', message: 'Por favor, preencha todos os campos.' });
            return;
        }
        try {
            const formData = new FormData();
            formData.append('nome', nome);
            formData.append('email', email);
            formData.append('telefone', telefone);
            formData.append('documento', documento);
            formData.append('senha', senha);
            formData.append('tenantId', '00000000-0000-0000-0000-000000000001');
            formData.append('idEspec', especialidade.id);
            formData.append('docComprovacaoNumero', registro);
            // doc_comprovacao desabilitado temporariamente — banco sem suporte a arquivos no momento

            console.log("=== ENVIANDO CADASTRO TÉCNICO / VOLUNTÁRIO ===");

            const response = await api.post('/usuarios/cadastro/tecnico', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log("Cadastro técnico pendente de aprovação:", response.data);

            show({
                type: 'success',
                title: 'Cadastro Enviado',
                message: 'Seu cadastro está pendente de aprovação pela Defesa Civil. Você receberá uma notificação quando for aprovado.',
                confirmLabel: 'OK',
                onConfirm: () => router.replace("/"),
            });

        } catch (error: any) {
            console.error("Erro no cadastro de técnico:", error.response?.data || error.message);
            const errorMessage = error.response?.data?.mensagem || "Não foi possível realizar o cadastro.";
            show({ type: 'error', title: 'Erro no Cadastro', message: errorMessage });
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {modal}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.select({ ios: "padding", android: "height" })}
            >
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.header}>
                        <Text style={styles.title}>Cadastro de Voluntário</Text>
                        <Text style={styles.subtitle}>Preencha seus dados de atuação técnica e anexe sua comprovação para aprovação da Defesa Civil.</Text>
                    </View>

                    <View style={styles.form}>
                        <Input 
                            placeholder="Nome Completo"
                            onChangeText={setNome}
                            value={nome}
                        />
                        <Input 
                            placeholder="E-mail"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onChangeText={setEmail}
                            value={email}
                        />
                        <Input 
                            placeholder="Telefone (com DDD)"
                            keyboardType="phone-pad"
                            onChangeText={setTelefone}
                            value={telefone}
                        />
                        <Input 
                            placeholder="CPF"
                            keyboardType="numeric"
                            onChangeText={setDocumento}
                            value={documento}
                        />
                        <Input 
                            placeholder="Senha"
                            secureTextEntry
                            onChangeText={setSenha}
                            value={senha}
                        />

                        {/* Seletor de Especialidade */}
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => !especsLoading && setModalVisible(true)}
                            activeOpacity={0.7}
                            disabled={especsLoading}
                        >
                            {especsLoading ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <ActivityIndicator size="small" color={Colors.blue.dark} />
                                    <Text style={styles.pickerButtonText}>Carregando especialidades...</Text>
                                </View>
                            ) : (
                                <Text style={especialidade ? styles.pickerButtonTextActive : styles.pickerButtonText}>
                                    {especialidade ? `Especialidade: ${especialidade.nome}` : "Selecionar Especialidade Técnica"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <Input 
                            placeholder="Número de Registro Profissional (ex: CRM, COREN, CREA)"
                            onChangeText={setRegistro}
                            value={registro}
                        />

                        {/* Botão de Documento Comprovante (Temporariamente Desabilitado) */}
                        {/*
                        <TouchableOpacity
                            style={[
                                styles.documentButton,
                                comprovante && styles.documentButtonSelected
                            ]}
                            onPress={handlePickDocument}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.documentButtonText}>
                                {comprovante ? "Alterar Comprovante Anexado" : "Anexar Comprovante Técnico (PDF/Imagem)"}
                            </Text>
                        </TouchableOpacity>
                        */}

                        {/* Feedback visual do documento selecionado (Temporariamente Desabilitado) */}
                        {/*
                        {comprovante && (
                            <View style={styles.fileFeedbackContainer}>
                                <Text style={styles.fileFeedbackLabel} numberOfLines={1}>
                                    Arquivo: {comprovante.name}
                                </Text>
                                <TouchableOpacity onPress={() => setComprovante(null)}>
                                    <Text style={styles.removeFileText}>Remover</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        */}

                        <View style={styles.buttonContainer}>
                            <Button label="Enviar Cadastro" onPress={handleRegister} />
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal de Seleção de Especialidades */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione sua Especialidade</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalCloseButtonText}>Fechar</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <FlatList
                            data={especialidades}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setEspecialidade(item);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        especialidade?.id === item.id && styles.modalItemTextActive
                                    ]}>
                                        {item.nome}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            contentContainerStyle={styles.listContainer}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FEFEFE",
    },
    container: {
        flexGrow: 1,
        padding: 32,
    },
    header: {
        marginTop: 20,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#082B97",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#5e5e5e",
        lineHeight: 22,
    },
    form: {
        gap: 16,
    },
    pickerButton: {
        height: 48,
        borderWidth: 1,
        borderColor: Colors.blue.light,
        backgroundColor: Colors.brand.white,
        borderRadius: 8,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    pickerButtonText: {
        color: Colors.neutral.gray,
        fontSize: 16,
    },
    pickerButtonTextActive: {
        color: Colors.blue.dark,
        fontSize: 16,
        fontWeight: '600',
    },
    documentButton: {
        height: 48,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: "#2F9FF2",
        backgroundColor: "rgba(47, 159, 242, 0.05)",
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    documentButtonSelected: {
        borderColor: "#2E7D32",
        backgroundColor: "rgba(46, 125, 50, 0.05)",
    },
    documentButtonText: {
        color: "#2F9FF2",
        fontSize: 15,
        fontWeight: '700',
    },
    fileFeedbackContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 8,
        marginTop: -8,
    },
    fileFeedbackLabel: {
        fontSize: 14,
        color: '#5e5e5e',
        flex: 1,
        marginRight: 8,
    },
    removeFileText: {
        color: '#D32F2F',
        fontSize: 14,
        fontWeight: '700',
    },
    buttonContainer: {
        marginTop: 16,
    },
    backButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    backButtonText: {
        color: "#2F9FF2",
        fontWeight: "700",
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '70%',
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#082B97',
    },
    modalCloseButtonText: {
        color: '#2F9FF2',
        fontSize: 16,
        fontWeight: '700',
    },
    listContainer: {
        paddingBottom: 24,
    },
    modalItem: {
        padding: 16,
    },
    modalItemText: {
        fontSize: 16,
        color: '#333333',
    },
    modalItemTextActive: {
        color: '#082B97',
        fontWeight: '700',
    },
    separator: {
        height: 1,
        backgroundColor: '#EEEEEE',
    }
});
