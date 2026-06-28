import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import { Button, Card, Input } from "@/components/ui";

function App() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Grain + Vignette overlays */}
      <div className="grain" />
      <div className="vignette" />

      <div className="max-w-2xl mx-auto px-5 py-12 space-y-8">
        <h1 className="font-heading text-[2.5rem] text-text leading-tight">
          Hüseyin Ajuz
          <br />
          <span className="text-teal">Patient CRM</span>
        </h1>

        <p className="text-text-secondary text-base leading-relaxed">
          Design system preview — warm medical-trust palette with DM Serif
          Display headings, Inter body text, grain overlay, and vignette.
        </p>

        {/* Card component */}
        <Card>
          <h2 className="font-heading text-2xl text-text mb-4">
            Component Preview
          </h2>

          {/* Input component */}
          <div className="space-y-4 mb-6">
            <Input
              label="Patient Name"
              placeholder="Enter patient name…"
              hint="Full legal name as on ID"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="patient@example.com"
              error="Please enter a valid email address"
            />
          </div>

          {/* Button variants */}
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </Card>

        {/* Second card */}
        <Card>
          <h2 className="font-heading text-2xl text-text mb-2">
            Typography Scale
          </h2>
          <p className="text-text-secondary text-sm">
            Body text in Inter — clean, precise, and readable for data-heavy UI.
          </p>
          <p className="text-text-muted text-xs mt-2 uppercase tracking-wider font-semibold">
            Muted label style — 0.7rem, 600 weight, uppercase
          </p>
        </Card>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
