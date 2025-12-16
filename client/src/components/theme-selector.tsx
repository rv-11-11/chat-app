import { PaletteIcon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { THEMES } from "@/constants";

const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Theme</h3>
        <PaletteIcon className="w-5 h-5" />
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {THEMES.map((themeOption) => (
          <button
            key={themeOption.name}
            className={`
              p-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2
              ${
                theme === themeOption.name
                  ? "border-primary bg-primary/10"
                  : "border-base-content/10 hover:border-base-content/20 hover:bg-base-content/5"
              }
            `}
            onClick={() => setTheme(themeOption.name)}
          >
            <div className="flex gap-1">
              {themeOption.colors.map((color, i) => (
                <span
                  key={i}
                  className="w-4 h-4 rounded-full border border-base-content/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-center">{themeOption.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
