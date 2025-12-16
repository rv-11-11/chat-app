import SectionHeader from "@/components/section-header";
import { FileText, Shield, Scale, Info } from "lucide-react";

const LegalPage = () => {
  return (
    <div className="h-screen overflow-y-auto pb-20 bg-background">
      <div className="p-4">
        <SectionHeader title="Terms & privacy" className="mb-6" />

        <div className="max-w-3xl mx-auto space-y-6 text-sm">
          <div className="rounded-xl border border-base-300 bg-base-100/70 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground">
              This page is a **template**. Replace the text below with your real legal copy
              before going to production.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <section className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-700">
                <FileText className="h-3 w-3" />
                Terms of use
              </div>
              <p className="text-xs text-muted-foreground">
                This application is provided for messaging and community use. By using the app
                you agree to follow all applicable laws, respect other users, and avoid abusive,
                illegal, or spam behaviour.
              </p>
            </section>

            <section className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700">
                <Shield className="h-3 w-3" />
                Privacy
              </div>
              <p className="text-xs text-muted-foreground">
                Messages and account data are processed only as needed to deliver chat,
                channels, and notifications. You should customise this section with your real
                privacy policy, including how long you keep data and how users can request
                deletion.
              </p>
            </section>

            <section className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-700">
                <Scale className="h-3 w-3" />
                User agreement
              </div>
              <p className="text-xs text-muted-foreground">
                By creating an account or using the service you accept these terms. Replace
                this with your official agreement text (acceptable use, liability, contact
                email, etc.) when you are ready to launch.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
