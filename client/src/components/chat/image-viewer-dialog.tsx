import { X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface ImageViewerDialogProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageViewerDialog = ({ imageUrl, onClose }: ImageViewerDialogProps) => {
  const { theme } = useTheme();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/90 z-[200]" 
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors z-[220] ${
            theme === "dark" 
              ? "bg-slate-800 hover:bg-slate-700 text-white" 
              : "bg-white hover:bg-gray-100 text-black"
          }`}
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Image */}
        <div className="relative max-w-[90vw] max-h-[90vh]">
          <img
            src={imageUrl}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </>
  );
};

export default ImageViewerDialog;
