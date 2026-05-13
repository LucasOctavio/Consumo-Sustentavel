import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../navigation/AppNavigator";

export const Button = ({
  title,
  onPress,
  type = "primary",
  style,
  disabled,
}) => {
  const { colors } = useTheme();

  const getBgColor = () => {
    switch (type) {
      case "danger":
        return colors.danger;
      case "google":
        return colors.google;
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (type === "google") return "#4285F4"; // Text color for google button to match icon
    return "#FFFFFF";
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBgColor() },
        style,
        disabled && { opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginVertical: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
