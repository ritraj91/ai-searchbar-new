
import { useEffect } from "react";
import { useCapabilities } from "../context/CapabilityRegistry";

export default function AIAction({
  id,
  name,
  description,
  onExecute,
  path,
  roles = ["admin", "manager", "employee"],
  className = "primary-button",
  children
}) {
  const { registerCapability } = useCapabilities();

  // Automatically register this action.
  useEffect(() => {
    const unregister = registerCapability({
      id,
      name,
      description,
      type: "action",
      path,
      roles,
      handler: onExecute
    });

    return unregister;
  }, [
    id,
    name,
    description,
    path,
    roles,
    onExecute,
    registerCapability
  ]);

  // Execute the actual React functionality.
  const handleClick = () => {
    if (typeof onExecute === "function") {
      onExecute();
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
    >
      {children || name}
    </button>
  );
}
