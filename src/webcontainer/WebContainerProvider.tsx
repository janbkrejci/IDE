// WebContainerProvider.js
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebContainer } from '@webcontainer/api';

// Create the context
const WebContainerContext = createContext<WebContainer | null>(null);

// Custom provider component
export const WebContainerProvider = ({ children }: { children: ReactNode; }) => {
    const [webContainer, setWebContainer] = useState<WebContainer | null>(null);

    useEffect(() => {


        // Initialize WebContainer instance once on mount
        const initializeWebContainer = async () => {
            const instance = await WebContainer.boot();
            setWebContainer(instance);
        };

        initializeWebContainer();


        // Optional cleanup if needed
        return () => {
            if (webContainer) {
                webContainer.teardown();
            }
        };
    }, []);

    return (
        <WebContainerContext.Provider value={webContainer} >
            {children}
        </WebContainerContext.Provider>
    );
};

// Custom hook to use the WebContainer context
export const useWebContainer = () => {
    const context = useContext(WebContainerContext);
    if (context === null) {
        throw new Error("useWebContainer must be used within a WebContainerProvider");
    }
    return context;
};
