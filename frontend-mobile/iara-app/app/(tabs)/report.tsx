import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Colors } from '../../constants/theme';

export default function Report() {
    return (
        // 1. O SafeAreaView garante que o app não invada a área da câmera/relógio
        <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor={Colors.neutral.gray} />    
            <View style={styles.container}>
                <ScreenHeader 
                    title="REPORTAR RISCO!"
                    subtitle="Seu aviso será enviado para nossa equipe!" 
                />
                
                {/* O resto do formulário do IARA vem aqui embaixo... */}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.neutral.gray, // Pinta o fundo por trás do relógio
    },
    container: {
        flex: 1,
        paddingHorizontal: 24, // Espaçamento apenas nas laterais
        paddingTop: 34, // Um respiro leve e padronizado após a área segura
    }
});