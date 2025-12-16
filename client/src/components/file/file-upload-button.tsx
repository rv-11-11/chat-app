import { memo, useRef } from "react";
import { Button } from "../ui/button";
import { Paperclip } from "lucide-react";
import { Spinner } from "../ui/spinner";

interface FileUploadButtonProps {
  onFileSelect: (file: {
    data: string;
    name: string;
    type: string;
    size: number;
  }) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
  "application/x-rar-compressed",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const FileUploadButton = memo(
  ({
    onFileSelect,
    isLoading = false,
    disabled = false,
  }: FileUploadButtonProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(
          `File type '${file.type}' is not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP, RAR, PPT`
        );
        return;
      }

      // Validate file size (50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("File size exceeds 50MB limit");
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        onFileSelect({
          data: base64,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      };
      reader.readAsDataURL(file);

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          disabled={isLoading || disabled}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading || disabled}
          title="Attach file"
        >
          {isLoading ? (
            <Spinner className="w-4 h-4" />
          ) : (
            <Paperclip className="!h-5 !w-5 !stroke-1" />
          )}
        </Button>
      </>
    );
  }
);
FileUploadButton.displayName = "FileUploadButton";
