import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaginationLoaderProps {
  currentPage: number;
  totalPages: number;
  onLoadMore: () => void;
  isLoading: boolean;
}

export const PaginationLoader = ({
  currentPage,
  totalPages,
  onLoadMore,
  isLoading,
}: PaginationLoaderProps) => {
  if (currentPage >= totalPages) {
    return null;
  }

  return (
    <div className="flex justify-center py-4">
      <Button
        onClick={onLoadMore}
        disabled={isLoading}
        variant="outline"
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          `Load More (${currentPage}/${totalPages})`
        )}
      </Button>
    </div>
  );
};
