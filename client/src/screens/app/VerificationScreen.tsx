import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { Button, Card, FilePicker, Page, PageHeader, Row, Spinner, Stack, Text, toast } from "@/components/ui";
import { CameraIcon, ShieldIcon, CheckIcon, CloseIcon } from "@/components/icons";
import { getVerificationStatus, submitSelfie } from "@/features/safety/safety.api";
import { ApiError } from "@/lib/api";

/** /app/verify — live selfie, checked against the profile photo, then deleted. */
export function VerificationScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["verification"], queryFn: getVerificationStatus });

  const [streaming, setStreaming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setStreaming(true);
      // The element mounts with `streaming`, so attach on the next tick.
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      toast("Camera unavailable — check permissions", "error");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  };

  const send = async (blob: Blob) => {
    setSubmitting(true);
    try {
      const res = await submitSelfie(blob);
      await queryClient.invalidateQueries({ queryKey: ["verification"] });
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      if (res.status === "verified") {
        toast("Verified — your badge is live", "success");
      } else {
        toast(res.reason ?? "We couldn't confirm it's you", "error");
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Verification failed", "error");
    } finally {
      setSubmitting(false);
      stopCamera();
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => blob && void send(blob), "image/jpeg", 0.9);
  };

  const captureNative = async () => {
    try {
      const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        direction: "FRONT" as never,
      });
      if (!photo.webPath) return;
      void send(await (await fetch(photo.webPath)).blob());
    } catch {
      // Cancelled.
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70svh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  const status = data?.status ?? "unverified";

  return (
    <Page width="narrow">
      <PageHeader eyebrow="Trust" title="Verify it's you" />
      <Stack gap={5}>
        {status === "verified" ? (
          <Card variant="gold">
            <Stack gap={3} className="items-center py-4 text-center">
              <span className="flex size-14 items-center justify-center rounded-full border border-gold text-gold">
                <CheckIcon size={26} />
              </span>
              <Text variant="heading" tone="gold">
                You're verified
              </Text>
              <Text variant="caption" tone="dim">
                Your matches can see that you are who you say you are.
              </Text>
              <Button variant="outline" size="sm" onPress={() => void navigate("/app/profile")}>
                Back to your profile
              </Button>
            </Stack>
          </Card>
        ) : (
          <>
            <Card>
              <Stack gap={4}>
                <Row gap={3}>
                  <ShieldIcon size={20} className="shrink-0 text-gold" />
                  <Text variant="body">A quick selfie, then it's gone</Text>
                </Row>
                <Text variant="caption" tone="dim" className="leading-relaxed">
                  We compare a live selfie with your first profile photo to confirm you're a real person — nothing
                  more. The selfie is never shown to anyone and is deleted the moment the check finishes.
                </Text>
                {data?.reason && status === "rejected" && (
                  <Row gap={2} className="items-start">
                    <CloseIcon size={14} className="mt-0.5 shrink-0 text-crimson" />
                    <Text variant="caption" tone="crimson">
                      {data.reason}
                    </Text>
                  </Row>
                )}
                {typeof data?.attemptsLeft === "number" && data.attemptsLeft < 5 && (
                  <Text variant="caption" tone="dim">
                    {data.attemptsLeft} attempt{data.attemptsLeft === 1 ? "" : "s"} remaining
                  </Text>
                )}
              </Stack>
            </Card>

            {streaming && (
              <Card padded={false} className="overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="aspect-[3/4] w-full scale-x-[-1] object-cover"
                />
              </Card>
            )}

            <Stack gap={3}>
              {Capacitor.isNativePlatform() ? (
                <Button fullWidth loading={submitting} onPress={() => void captureNative()}>
                  <CameraIcon size={16} />
                  Take a selfie
                </Button>
              ) : streaming ? (
                <>
                  <Button fullWidth loading={submitting} onPress={capture}>
                    <CameraIcon size={16} />
                    Capture
                  </Button>
                  <Button fullWidth variant="ghost" onPress={stopCamera}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button fullWidth loading={submitting} onPress={() => void startCamera()}>
                    <CameraIcon size={16} />
                    Open camera
                  </Button>
                  <FilePicker
                    accept="image/jpeg,image/png,image/webp"
                    onFiles={(files) => files[0] && void send(files[0])}
                    className="w-full cursor-pointer border-none bg-transparent p-0"
                  >
                    <span className="block w-full rounded-full border border-charcoal py-3 text-center font-body text-sm tracking-elegant uppercase text-ivory-dim transition-colors duration-base hover:border-gold hover:text-gold">
                      Upload a photo instead
                    </span>
                  </FilePicker>
                </>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Page>
  );
}
