import { extendTheme } from '@chakra-ui/react'

const fonts = {
  mono: `'Menlo', monospace`,
  heading: "'RocknRoll One', sans-serif",
  body: "'RocknRoll One', sans-serif"
}

const breakpoints = {
  sm: '40em',
  md: '52em',
  lg: '64em',
  xl: '80em',
}

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',  // デフォルトでダークモード
    useSystemColorMode: false, // システムの設定を使用しない
  },

  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
      },
    },
  },

  colors: {
    // カスタムカラーパレット
    blue: {
      50: '#E6F6FF',
      100: '#BAE3FF',
      200: '#7CC4FA',
      300: '#47A3F3',
      400: '#2186EB',
      500: '#0967D2',
      600: '#0552B5',
      700: '#03449E',
      800: '#01337D',
      900: '#002159',
    },
    cyan: {
      50: '#EDFDFD',
      100: '#C4F1F9',
      200: '#9DECF9',
      300: '#76E4F7',
      400: '#0BC5EA',
      500: '#00B5D8',
      600: '#00A3C4',
      700: '#0987A0',
      800: '#086F83',
      900: '#065666',
    },
    black: '#16161D',
  },
  semanticTokens: {
    colors: {
      text: {
        default: '#16161D',
        _dark: '#E2E8F0',
      },
      heroGradientStart: {
        default: '#00B5D8',
        _dark: '#00A3C4',
      },
      heroGradientEnd: {
        default: '#0987A0',
        _dark: '#086F83',
      },
    },
    radii: {
      button: '12px',
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#111827' : 'white',
        color: props.colorMode === 'dark' ? '#F9FAFB' : 'gray.800',
      },
      // すべてのテキスト要素にデフォルト色を設定
      'h1, h2, h3, h4, h5, h6, p, span, label, a, div': {
        color: props.colorMode === 'dark' ? '#F9FAFB' : 'gray.800'
      },
      '.chakra-text': {
        color: props.colorMode === 'dark' ? '#F9FAFB' : 'gray.800'
      },
      '.chakra-heading': {
        color: props.colorMode === 'dark' ? '#F9FAFB' : 'gray.800'
      }
    }),
  },
  fonts,
  breakpoints,
})

export default theme
