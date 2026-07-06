import { ChevronUp, ChevronDown, Save } from "lucide-react";
import { useResumeBuilder } from "../../context/ResumeBuilderContext";
import type { SectionId } from "@resumeai/shared";

const SECTION_LABELS: Record<SectionId, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
};

const PRESET_COLORS = [
  "#1155cc",
  "#1a6be0",
  "#0f9d58",
  "#e53935",
  "#6d4c41",
  "#546e7a",
  "#000000",
];

export default function TemplateConfigPanel() {
  const { templateConfig, updateTemplateConfig, saveTemplateConfig } =
    useResumeBuilder();

  const {
    sectionOrder,
    sectionTitleColor,
    // nameAlignment,
    // titleAlignment,
    // summaryAlignment,
  } = templateConfig;

  const moveSection = (index: number, direction: "up" | "down") => {
    const newOrder = [...sectionOrder];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [
      newOrder[swapIndex],
      newOrder[index],
    ];
    updateTemplateConfig({ ...templateConfig, sectionOrder: newOrder });
  };

  const setAlignment = (
    field:
      | "nameAlignment"
      | "titleAlignment"
      | "summaryAlignment"
      | "contactAlignment",
    value: "left" | "center"
  ) => {
    updateTemplateConfig({ ...templateConfig, [field]: value });
  };
  const handleSave = async () => {
    await saveTemplateConfig();
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 bg-bg-sidebar border-b border-border shrink-0 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted whitespace-nowrap">
          Header Color
        </span>
        <div className="flex items-center gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() =>
                updateTemplateConfig({
                  ...templateConfig,
                  sectionTitleColor: color,
                })
              }
              style={{ backgroundColor: color }}
              className={`w-4 h-4 rounded-full transition-transform hover:scale-110 ${
                sectionTitleColor === color
                  ? "ring-2 ring-offset-1 ring-offset-bg-sidebar ring-white"
                  : ""
              }`}
            />
          ))}
          <input
            type="color"
            value={sectionTitleColor}
            onChange={(e) =>
              updateTemplateConfig({
                ...templateConfig,
                sectionTitleColor: e.target.value,
              })
            }
            className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
            title="Custom color"
          />
        </div>
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      <div className="flex items-center gap-3">
        <span className="text-xs text-text-muted whitespace-nowrap">
          Alignment
        </span>
        <div className="flex items-center gap-2">
          {(
            [
              { field: "nameAlignment", label: "Name" },
              { field: "titleAlignment", label: "Title" },
              { field: "summaryAlignment", label: "Summary" },
              { field: "contactAlignment", label: "Contact" },
            ] as {
              field:
                | "nameAlignment"
                | "titleAlignment"
                | "summaryAlignment"
                | "contactAlignment";
              label: string;
            }[]
          ).map(({ field, label }) => (
            <div key={field} className="flex items-center gap-1">
              <span className="text-xs text-text-muted">{label}</span>
              <div className="flex rounded overflow-hidden border border-border">
                {(["left", "center"] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => setAlignment(field, align)}
                    className={`px-2 py-0.5 text-xs transition-colors ${
                      templateConfig[field] === align
                        ? "bg-accent text-white"
                        : "bg-bg-input text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {align === "left" ? "L" : "C"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted whitespace-nowrap">
          Sections
        </span>
        <div className="flex items-center gap-1">
          {sectionOrder.map((sectionId, index) => (
            <div
              key={sectionId}
              className="flex items-center gap-0.5 bg-bg-input border border-border rounded px-2 py-0.5"
            >
              <span className="text-xs text-text-primary">
                {SECTION_LABELS[sectionId]}
              </span>
              <div className="flex flex-col ml-1">
                <button
                  onClick={() => moveSection(index, "up")}
                  disabled={index === 0}
                  className="text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  onClick={() => moveSection(index, "down")}
                  disabled={index === sectionOrder.length - 1}
                  className="text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                >
                  <ChevronDown size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-xs px-3 py-1.5 rounded-md transition-colors ml-auto"
      >
        <Save size={12} />
        Save
      </button>
    </div>
  );
}
