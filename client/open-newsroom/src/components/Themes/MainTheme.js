import { createMuiTheme } from '@material-ui/core/styles';

const MainTheme = {
  c222: createMuiTheme({
    palette: {
      background: {
        default: '#000'
      }, primary: {
        main: '#222'
      }, secondary: {
        main: '#333'
      }
    }
  }),
}

export default MainTheme;