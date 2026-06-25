import { ResumeBuilderProvider } from "../context/ResumeBuilderContext";
import ResumeForm from "../components/resume/ResumeForm";
import ResumePreview from "../components/resume/ResumePreview";

export default function ResumeBuilder() {
  return (
    <ResumeBuilderProvider>
      <div className="flex h-full gap-6">
        <ResumeForm />
        <ResumePreview />
      </div>
    </ResumeBuilderProvider>
  );
}
