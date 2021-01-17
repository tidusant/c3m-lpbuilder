import '../styles/global.css'

import '../styles/vendor.css'
import '../styles/blurapp.css'
import 'react-toastify/dist/ReactToastify.min.css';
import '../styles/cus.css'

import { Provider } from 'react-redux'
import { useStore } from '../store'
const App = ({ Component, pageProps }) => {
    const store = useStore(pageProps.initialReduxState)
    return <div>
        <Provider store={store}>
            <Component {...pageProps} />
        </Provider>
    </div>
  };
  
  
  export default App;