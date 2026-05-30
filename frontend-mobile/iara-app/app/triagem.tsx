import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme'; 

export default function Triagem() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                
                <View style={styles.header}>
                    <Text style={styles.title}>Junte-se ao IARA</Text>
                    <Text style={styles.subtitle}>Como você deseja contribuir com a nossa rede de apoio?</Text>
                </View>

                <View style={styles.cardsContainer}>
                    {/* Botão Quero Doar */}
                    <TouchableOpacity 
                        style={styles.card} 
                        onPress={() => router.push('/signup-doador')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cardTitle}>Quero Doar!</Text>
                        <Text style={styles.cardDescription}>
                            Cadastre-se por aqui, se você quer ajudar doando para quem precisa.
                        </Text>
                    </TouchableOpacity>

                    {/* Botão Quero Atuar */}
                    <TouchableOpacity 
                        style={[styles.card, styles.cardSecondary]} 
                        onPress={() => router.push('/signup-voluntario')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cardTitle}>Quero Atuar!</Text>
                        <Text style={styles.cardDescription}>
                            Se você quer ser um voluntário e quer se disponibilizar para ser convocado para ajudar.
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Botão para voltar caso o usuário tenha clicado em cadastrar sem querer */}
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Voltar para o Login</Text>
                </TouchableOpacity>

            </ScrollView>
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
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: "#082B97",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#5e5e5e",
        lineHeight: 24,
    },
    cardsContainer: {
        gap: 24,
    },
    card: {
        backgroundColor: Colors.brand?.orange || "#FF8A00", // Fallback para o laranja caso o import mude
        padding: 24,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    cardSecondary: {
        backgroundColor: "#2F9FF2", // Azul para diferenciar o voluntário
    },
    cardTitle: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
    },
    cardDescription: {
        color: "#FFFFFF",
        fontSize: 15,
        lineHeight: 22,
        opacity: 0.9,
    },
    backButton: {
        marginTop: 40,
        alignItems: 'center',
    },
    backButtonText: {
        color: "#5e5e5e",
        fontWeight: "600",
        fontSize: 16,
    }
});