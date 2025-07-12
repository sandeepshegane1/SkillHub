import { createContext, useContext, useEffect, useState } from "react";
import { getUserCartService } from "@/services";
import { AuthContext } from "../auth-context";

export const CartContext = createContext(null);

export default function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { auth } = useContext(AuthContext);

  const fetchCartItems = async () => {
    if (!auth?.authenticate || !auth?.user?._id) return;
    
    try {
      setLoading(true);
      const response = await getUserCartService(auth.user._id);
      
      if (response.success) {
        setCartItems(response.data?.items || []);
        setCartCount(response.data?.items?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.authenticate) {
      fetchCartItems();
    } else {
      setCartItems([]);
      setCartCount(0);
    }
  }, [auth?.authenticate, auth?.user?._id]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        loading,
        fetchCartItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
