import { createContext, useContext, useState, useEffect } from 'react';
import { getBots } from '../lib/api';

const BotContext = createContext(null);

export function BotProvider({ children }) {
    const [bots, setBots] = useState([]);
    const [selectedBot, setSelectedBot] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) { setLoading(false); return; }

        getBots().then((data) => {
            setBots(data);
            const saved = localStorage.getItem('selected_bot');
            const found = data.find(b => b.bot_id === saved);
            setSelectedBot(found || data[0] || null);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const switchBot = (bot) => {
        setSelectedBot(bot);
        localStorage.setItem('selected_bot', bot.bot_id);
    };

    return (
        <BotContext.Provider value={{ bots, selectedBot, switchBot, botsLoading: loading }}>
            {children}
        </BotContext.Provider>
    );
}

export function useBot() {
    return useContext(BotContext);
}
