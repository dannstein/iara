import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme';

interface ScreenHeader {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // É aqui que os filtros vão entrar, se existirem!
}

export function ScreenHeader({ title, subtitle, children }: ScreenHeader) {
  return (
    
    <View style={styles.cardContainer}>
      
      {/* Textos Centralizados conforme a imagem */}
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Se você passar algum filtro ou barra de pesquisa, ele renderiza aqui */}
      {children && (
        <View style={styles.filtersWrapper}>
          {children}
        </View>
      )}
      
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "transparent",
    // Arredondamento e sombras com as mesmas características dos outros cards
    borderRadius: 8,
    padding: 10,
    marginBottom: 10, // Espaço entre o header e a lista que virá abaixo
    width: '100%',
    

  },
  textWrapper: {
    alignItems: 'center', // Centraliza os textos como na imagem
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800', // Bem destacado
    color: Colors.blue.bar,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.blue.dark, // Um tom de azul/cinza mais claro para o subtítulo
    textAlign: 'center',
  },
  filtersWrapper: {
    marginTop: 16, // Só aplica margem se existir algum filtro
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9', // Uma linha sutil separando o título dos filtros
  }
 
});