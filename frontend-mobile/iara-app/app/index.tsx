import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

// Importações novas para ligar com a API
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from '../services/api';
import * as SecureStore from 'expo-secure-store';

export default function Index(){
    const { refresh } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Corrigi o nome da função para o padrão handleSignIn
    async function handleSignIn(){
        // 1. Validação básica antes de chamar o servidor
        if (!email || !password) {
            Alert.alert("Atenção", "Preencha o e-mail e a senha.");
            return;
        }

        try {
            // 2. Chamada para a rota exata do Handout
            const response = await api.post('/auth/mobile/login', {
                email: email,
                senha: password // Traduzindo para o formato que o Spring Boot espera
            });

            // 3. Extrai os dados do TokenResponse
            const { accessToken, role } = response.data;

            // 4. Salva o token no cofre do dispositivo
            await SecureStore.setItemAsync('accessToken', accessToken);

            // Salva os dados do usuário para poder mostrar nome/cargo nas outras telas
            await SecureStore.setItemAsync('userData', JSON.stringify(response.data));

            console.log(`Login realizado com sucesso! Perfil: ${role}`);

            // 5. Atualiza o AuthContext com o role recém salvo antes de navegar
            await refresh();
            // Aguarda o React processar o setState do refresh antes de navegar,
            // evitando que as tabs renderizem com role=null (bug aba Report).
            await new Promise<void>((r) => setTimeout(r, 150));

            // 6. Redireciona para as abas logadas
            router.replace("/(tabs)/home");

        } catch (error: any) {
            // 6. Tratamento de erro padronizado pelo Handout
            console.log("Erro da API:", error.response?.data);
            
            const mensagemErro = error.response?.data?.mensagem || "Não foi possível conectar ao servidor.";
            Alert.alert("Erro no Login", mensagemErro);
        }
    }
    
    return(
        <KeyboardAvoidingView 
            style={{flex:1}}
            behavior={Platform.select({ios: "padding", android:"height"})}
        >
            <ScrollView contentContainerStyle={{flexGrow:1}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    
                    <View style={styles.header}>
                        <Image 
                            source={require("@/assets/images/logo.png")}
                            style={styles.ilustration}
                        />
                        <Text style={styles.iara}>IARA</Text>
                    </View>

                    <View style={styles.loginSection}>
                        
                        <View style={styles.form}>
                            <Input 
                                placeholder="E-mail"
                                keyboardType="email-address"
                                autoCapitalize="none" // Evita que o celular coloque a primeira letra maiúscula no e-mail
                                onChangeText={setEmail}
                            />
                            <Input
                                placeholder="Senha"
                                secureTextEntry
                                onChangeText={setPassword}
                            />
                            {/* Vinculando o botão à função real de login */}
                            <Button label="Entrar" onPress={handleSignIn}/>
                            
                            <Text style={styles.footerText}> 
                                Não tem uma conta? {" "}
                                <Link href="/triagem" style={styles.footerLink}>Cadastre-se aqui.</Link>
                            </Text>
                        </View>
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FEFEFE",
        padding: 32,
        justifyContent: "space-between", 
    },
    header: {
        alignItems: "center", 
        marginTop: 40,
        marginBottom: 10, 
    },
    ilustration: {
        width: 140, 
        height: 140,
        resizeMode: "center"
    },
    iara: {   
        color: Colors.brand.orange,
        fontSize: 48, 
        fontWeight: "900",
    },
    loginSection: {
        flex: 1, 
        justifyContent: "flex-start",
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: "#082B97" 
    },
    subtitle: {
        fontSize: 16,
        color: "#5e5e5e",
        marginTop: 8,
    },
    form: {
        marginTop: 32,
        gap: 16, 
    },
    footerText: {
        textAlign: "center",
        marginTop: 10,
        marginBottom: 10,
        color: "#5e5e5e"
    },
    footerLink: {
        color: "#2F9FF2",
        fontWeight: "700",
    },
});