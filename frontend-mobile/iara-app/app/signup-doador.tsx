import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import * as SecureStore from 'expo-secure-store';
import { useAppModal } from '../components/AppModal';

export default function SignupDoador() {
    const { show, modal } = useAppModal();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [documento, setDocumento] = useState(""); // CPF
    const [senha, setSenha] = useState("");

    async function handleRegister() {
        if (!nome || !email || !telefone || !documento || !senha) {
            show({ type: 'warning', title: 'Campos obrigatórios', message: 'Por favor, preencha todos os campos.' });
            return;
        }

        try {
            const response = await api.post('/usuarios/cadastro/doador', {
                nome,
                email,
                telefone,
                documento,
                senha,
                tenantId: '00000000-0000-0000-0000-000000000001',
            });

            const { accessToken, role } = response.data;

            await SecureStore.setItemAsync('accessToken', accessToken);
            await SecureStore.setItemAsync('userData', JSON.stringify(response.data));

            console.log(`Cadastro de Doador e Login realizado! Perfil: ${role}`);
            show({
                type: 'success',
                title: 'Conta criada!',
                message: 'Cadastro realizado com sucesso.',
                confirmLabel: 'Entrar',
                onConfirm: () => router.replace("/(tabs)/home"),
            });

        } catch (error: any) {
            console.error("Erro no cadastro de doador:", error.response?.data || error.message);
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
                        <Text style={styles.title}>Cadastro de Doador</Text>
                        <Text style={styles.subtitle}>Preencha seus dados básicos para começar a ajudar.</Text>
                    </View>

                    <View style={styles.form}>
                        <Input 
                            placeholder="Nome Completo"
                            onChangeText={setNome}
                        />
                        <Input 
                            placeholder="E-mail"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onChangeText={setEmail}
                        />
                        <Input 
                            placeholder="Telefone (com DDD)"
                            keyboardType="phone-pad"
                            onChangeText={setTelefone}
                        />
                        <Input 
                            placeholder="CPF"
                            keyboardType="numeric"
                            onChangeText={setDocumento}
                        />
                        <Input 
                            placeholder="Senha"
                            secureTextEntry
                            onChangeText={setSenha}
                        />

                        <View style={styles.buttonContainer}>
                            <Button label="Criar Conta" onPress={handleRegister} />
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
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
    },
    form: {
        gap: 16,
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
    }
});