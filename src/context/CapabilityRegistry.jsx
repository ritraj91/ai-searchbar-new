
import {
  createContext,
  useCallback,
  useContext,
  useState
} from "react";

const CapabilityContext = createContext(null);

export function CapabilityProvider({ children }) {
  const [capabilities, setCapabilities] = useState([]);

  // Register a page or action.
  const registerCapability = useCallback((capability) => {
    if (
      !capability?.id ||
      !capability?.name ||
      !capability?.description
    ) {
      console.error("Invalid capability registration:", capability);
      return () => {};
    }

    setCapabilities((previous) => {
      const filtered = previous.filter(
        (item) => item.id !== capability.id
      );

      return [
        ...filtered,
        {
          ...capability,
          type: capability.type || "page"
        }
      ];
    });

    // Return cleanup function.
    return () => {
      setCapabilities((previous) =>
        previous.filter((item) => item.id !== capability.id)
      );
    };
  }, []);

  // Get all registered capabilities.
  const getCapabilities = useCallback(() => {
    return capabilities;
  }, [capabilities]);

  // Find one registered capability.
  const getCapability = useCallback(
    (id) => {
      return capabilities.find((item) => item.id === id);
    },
    [capabilities]
  );

  const value = {
    capabilities,
    registerCapability,
    getCapabilities,
    getCapability
  };

  return (
    <CapabilityContext.Provider value={value}>
      {children}
    </CapabilityContext.Provider>
  );
}

// Access the registry from any component.
export function useCapabilities() {
  const context = useContext(CapabilityContext);

  if (!context) {
    throw new Error(
      "useCapabilities must be used inside CapabilityProvider."
    );
  }

  return context;
}
