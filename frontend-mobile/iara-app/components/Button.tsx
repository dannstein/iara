import {
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
} from "react-native";
import { Colors } from '../constants/theme';

type ButtonProps = TouchableOpacityProps & {
    label: string;
    variant?: "primary" | "secondary";
};

// O valor padrão do variant é "primary" caso você não passe nada
export function Button({ label, variant = "primary", ...rest }: ButtonProps) {
    const isPrimary = variant === "primary";

    return (
        <TouchableOpacity 
            style={[
                styles.container, 
                { backgroundColor: isPrimary ? Colors.blue.dark : Colors.blue.medium }
            ]} 
            activeOpacity={0.7} 
            {...rest}
        >
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: 48, // Múltiplo do grid de 8px
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8, // Conforme Design System (8 a 12px)
    },
    label: {
        color: Colors.brand.white,
        fontSize: 16,
        fontWeight: "600",
    },
});