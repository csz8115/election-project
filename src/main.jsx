import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'; // Redux Persist
import {store, persistor} from './client/store/store.ts';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}> {/* Redux Persist Gate */}
      <App />
    </PersistGate>
    </Provider>
  </StrictMode>,
)
