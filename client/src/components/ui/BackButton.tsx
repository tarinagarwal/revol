import { useNavigate } from "react-router-dom";
import { IconButton } from "./IconButton";
import { ChevronLeftIcon } from "@/components/icons";

/** History-back control for stacked screens. */
export function BackButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <IconButton label="Go back" onPress={() => void navigate(-1)} className={className ?? ""}>
      <ChevronLeftIcon size={20} />
    </IconButton>
  );
}
