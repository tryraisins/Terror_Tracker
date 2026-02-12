"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark",
    toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode; }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("nat-theme") as Theme | null;
        if (stored) {
            setTheme(stored);
            document.documentElement.setAttribute("data-theme", stored);
        } else {
            // Default to dark — fits the war / breaking news aesthetic
            document.documentElement.setAttribute("data-theme", "dark");
        }
    }, []);

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("nat-theme", next);
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return <div style={{ visibility: "hidden" }}>{children}</div>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
