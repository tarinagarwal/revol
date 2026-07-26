import { useState } from "react";
import { Button, Checkbox, RadioGroup, Sheet, Stack, Text, TextArea, toast } from "@/components/ui";
import { REPORT_LABELS, submitReport, type ReportReason } from "./safety.api";
import { ApiError } from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  reportedUserId: string;
  matchId?: string;
  onReported: () => void;
};

/** Report + block in one calm flow — blocking is on by default. */
export function ReportSheet({ open, onClose, reportedUserId, matchId, onReported }: Props) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!reason) {
      toast("Choose what happened", "error");
      return;
    }
    setSending(true);
    try {
      const res = await submitReport({
        reportedUserId,
        reason: reason as ReportReason,
        ...(details.trim() ? { details: details.trim() } : {}),
        ...(matchId ? { matchId } : {}),
        alsoBlock,
      });
      toast(res.blocked ? "Reported and blocked. You're safe here." : "Report received. Thank you.", "success");
      onReported();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not send report", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Report this person">
      <Stack gap={6}>
        <Text variant="caption" tone="dim">
          Your report is private — they're never told. Our team reviews every one.
        </Text>
        <RadioGroup
          value={reason}
          onChange={(v) => setReason(v as ReportReason)}
          options={(Object.keys(REPORT_LABELS) as ReportReason[]).map((r) => ({
            value: r,
            label: REPORT_LABELS[r],
          }))}
        />
        <TextArea
          label="Anything else we should know?"
          placeholder="Optional — the more context, the better we can act."
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
        />
        <Checkbox label="Also block them" checked={alsoBlock} onChange={setAlsoBlock} />
        <Stack gap={3}>
          <Button fullWidth loading={sending} onPress={() => void submit()}>
            Send report
          </Button>
          <Button fullWidth variant="ghost" onPress={onClose}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Sheet>
  );
}
