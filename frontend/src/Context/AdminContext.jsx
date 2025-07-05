import { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const token = Cookies.get("token");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to fetch user data
    const getUser = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACK_URL}/api/User?t=${Date.now()}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }

            const json = await response.json();
            setUser(json.user); // Ensure user data updates
        } catch (error) {
            console.error("Error fetching user data:", error);
            setUser(null); // Reset user on error
        } finally {
            setLoading(false);
        }
    };

    // Fetch user on component mount
    useEffect(() => {
        getUser();
    }, []);

    // Function to manually refresh user (use after login or role change)
    const refreshUser = async () => {
        setLoading(true);
        await getUser();
    };

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to access AuthContext
export const useAuth = () => useContext(AuthContext);
