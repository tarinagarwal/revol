import type { ReactNode } from "react";
import { useRef } from "react";

type FilePickerProps = {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  /** Trigger UI — rendered inside; click opens the picker. */
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

/**
 * File selection primitive — the input itself never renders visibly
 * (browsers offer no styleable file control; this is the sr-only pattern).
 */
export function FilePicker({ accept, multiple = false, onFiles, children, disabled = false, className }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = ""; // allow re-picking the same file
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={className ?? "cursor-pointer border-none bg-transparent p-0 text-inherit"}
      >
        {children}
      </button>
    </>
  );
}
