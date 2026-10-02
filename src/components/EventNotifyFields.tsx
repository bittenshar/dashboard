import { Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { EventNotify } from "@/hooks/useApiIntegration";

// Same limits the backend enforces.
const MAX_TITLE = 100;
const MAX_BODY = 500;

interface EventNotifyFieldsProps {
  id: string;
  value: EventNotify;
  onChange: (value: EventNotify) => void;
  label: string;
  hint: string;
  bodyLabel: string;
  titlePlaceholder: string;
  bodyPlaceholder: string;
}

/** The "notify …" switch with optional title and message, for the event create/edit forms. */
const EventNotifyFields = ({
  id,
  value,
  onChange,
  label,
  hint,
  bodyLabel,
  titlePlaceholder,
  bodyPlaceholder,
}: EventNotifyFieldsProps) => (
  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor={`${id}-send`} className="flex items-center gap-2 font-medium">
          <Bell className="h-4 w-4 text-orange-600" />
          {label}
        </Label>
        <p className="text-sm text-gray-500">{hint}</p>
      </div>
      <Switch
        id={`${id}-send`}
        checked={value.send}
        onCheckedChange={(send) => onChange({ ...value, send })}
      />
    </div>

    {value.send && (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-title`}>Title (optional)</Label>
          <Input
            id={`${id}-title`}
            value={value.title || ""}
            maxLength={MAX_TITLE}
            placeholder={titlePlaceholder}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-body`}>{bodyLabel}</Label>
          <Textarea
            id={`${id}-body`}
            rows={2}
            value={value.body || ""}
            maxLength={MAX_BODY}
            placeholder={bodyPlaceholder}
            onChange={(e) => onChange({ ...value, body: e.target.value })}
          />
        </div>
      </div>
    )}
  </div>
);

export default EventNotifyFields;
