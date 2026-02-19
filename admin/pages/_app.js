import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { BotProvider } from '../context/BotContext';

export default function App({ Component, pageProps }) {
    return (
        <BotProvider>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#16161f',
                        color: '#f0f0ff',
                        border: '1px solid #2a2a3a',
                        borderRadius: '10px',
                        fontSize: '14px',
                    },
                    success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
            />
            <Component {...pageProps} />
        </BotProvider>
    );
}
