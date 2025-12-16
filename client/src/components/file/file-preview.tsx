import { memo } from "react";
import { Download, X } from "lucide-react";
import { Button } from "../ui/button";

interface FilePreviewProps {
  file: {
    name: string;
    size: number;
    type: string;
  };
  onRemove?: () => void;
  isLoading?: boolean;
}

const getFileIcon = (type: string) => {
  if (type.includes("pdf")) return "📄";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("sheet") || type.includes("excel")) return "📊";
  if (type.includes("presentation")) return "📈";
  if (type.includes("zip") || type.includes("rar")) return "📦";
  if (type.includes("text")) return "📋";
  return "📎";
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const FilePreview = memo(
  ({ file, onRemove, isLoading = false }: FilePreviewProps) => {
    return (
      <div className="flex items-center gap-3 p-3 bg-accent rounded-lg border border-border">
        <div className="text-2xl">{getFileIcon(file.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onRemove}
            disabled={isLoading}
          >
            <X size={16} />
          </Button>
        )}
      </div>
    );
  }
);
FilePreview.displayName = "FilePreview";

interface FileMessageBubbleProps {
  file: {
    name: string;
    size: number;
    type: string;
    url: string;
  };
}

export const FileMessageBubble = memo(
  ({ file }: FileMessageBubbleProps) => {
    const handleDownload = () => {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="flex items-center gap-2 bg-accent rounded-lg p-3 max-w-xs">
        <div className="text-2xl shrink-0">{getFileIcon(file.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleDownload}
        >
          <Download size={16} />
        </Button>
      </div>
    );
  }
);
FileMessageBubble.displayName = "FileMessageBubble";
