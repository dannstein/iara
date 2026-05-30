import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { Colors } from '../constants/theme';

export function Input({ ...rest }: TextInputProps) {
    return (
        <TextInput 
            style={styles.input} 
            // Puxando a cor do placeholder direto do nosso Design System
            placeholderTextColor={Colors.neutral.gray} 
            {...rest} 
        />
    );
}

const styles = StyleSheet.create({
    input: {
        height: 48, // Mantido 48px (Múltiplo de 8)
        borderWidth: 1,
        borderColor: Colors.blue.light,
        backgroundColor: Colors.brand.white,
        borderRadius: 8, // Mantido 8px conforme Design System
        fontSize: 16,
        paddingHorizontal: 16, // Ajustado para o Grid de 8px
        color: Colors.blue.dark, // Para que o texto digitado tenha a cor da nossa marca
    },
});