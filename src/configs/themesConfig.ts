import { FuseThemesType } from "@fuse/core/FuseSettings/FuseSettings";

/**
 * The lightPaletteText object defines the text color palette for the light theme.
 */
export const lightPaletteText = {
  primary: "rgb(17, 24, 39)",
  secondary: "rgb(107, 114, 128)",
  disabled: "rgb(149, 156, 169)",
};

/**
 * The darkPaletteText object defines the text color palette for the dark theme.
 */
export const darkPaletteText = {
  primary: "rgb(255,255,255)",
  secondary: "rgb(148, 163, 184)",
  disabled: "rgb(156, 163, 175)",
};

/**
 * The themesConfig object is a configuration object for the color themes of the Fuse application.
 */
export const themesConfig: FuseThemesType = {
  default: {
    palette: {
      mode: "light",
      divider: "rgba(214,214,214,0.7)",
      text: {
        primary: "#212121",
        secondary: "#5F6368",
      },
      common: {
        black: "#000000",
        white: "#FFFFFF",
      },
      primary: {
        light: "#536D89",
        main: "#0A74DA",
        dark: "#00418A",
        contrastText: "#FFFFFF",
      },
      secondary: {
        light: "#6BC9F7",
        main: "#00A4EF",
        dark: "#0078D7",
        contrastText: "#FFFFFF",
      },
      background: {
        paper: "#F8FBFA",
        default: "#E8F3F0", // Tono verdoso suave
      },
      error: {
        light: "#FFCDD2",
        main: "#D32F2F",
        dark: "#B71C1C",
        contrastText: "#FFFFFF",
      },
      action: {
        hover: "rgba(232, 243, 240, 0.6)", // Tono verdoso suave para filas impares
        selected: "rgba(232, 243, 240, 0.9)", // Versión más intensa para hover
      },
    },
  },
  defaultDark: {
    palette: {
      mode: "dark",
      divider: "rgba(79,79,79,0.5)",
      text: {
        primary: "#E0E0E0",
        secondary: "#B0BEC5",
      },
      common: {
        black: "#000000",
        white: "#FFFFFF",
      },
      primary: {
        light: "#536D89",
        main: "#0A74DA",
        dark: "#00418A",
        contrastText: "#FFFFFF",
      },
      secondary: {
        light: "#6BC9F7",
        main: "#00A4EF",
        dark: "#0078D7",
        contrastText: "#FFFFFF",
      },
      background: {
        paper: "#1E1E1E",
        default: "#0E2E2D", // Fondo oscuro con tonalidad verdosa
      },
      error: {
        light: "#FFCDD2",
        main: "#D32F2F",
        dark: "#B71C1C",
        contrastText: "#FFFFFF",
      },
      action: {
        hover: "rgba(14, 46, 45, 0.5)", // Versión más oscura para modo oscuro
        selected: "rgba(14, 46, 45, 0.8)", // Versión más intensa para hover
      },
    },
  },
};

export default themesConfig;
