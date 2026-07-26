import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button, Card, Grid, Heading, Reveal, Skeleton, Stack, Text } from "@/components/ui";
import {
  AndroidIcon,
  AppleIcon,
  ArrowRightIcon,
  DownloadIcon,
  GlobeIcon,
  WindowsIcon,
  type IconProps,
} from "@/components/icons";
import { NavBar } from "@/components/layout/NavBar";
import { Footer } from "@/components/layout/Footer";

const RELEASES_API = "https://api.github.com/repos/tarinagarwal/revol/releases/latest";
const RELEASES_PAGE = "https://github.com/tarinagarwal/revol/releases/latest";

type ReleaseAsset = { name: string; browser_download_url: string; size: number };
type Release = { tag_name: string; published_at: string; assets: ReleaseAsset[] };

function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function detectPlatform(): "windows" | "android" | "mac" | "other" {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return "android";
  if (ua.includes("windows")) return "windows";
  if (ua.includes("mac")) return "mac";
  return "other";
}

type PlatformCard = {
  key: "windows" | "android" | "mac" | "web";
  icon: (p: IconProps) => React.ReactNode;
  title: string;
  blurb: string;
  match: (a: ReleaseAsset) => boolean;
  fallbackNote: string;
};

const platforms: PlatformCard[] = [
  {
    key: "windows",
    icon: WindowsIcon,
    title: "Windows",
    blurb: "Full desktop experience with built-in auto-update.",
    match: (a) => a.name.endsWith(".exe"),
    fallbackNote: "Installer coming shortly",
  },
  {
    key: "android",
    icon: AndroidIcon,
    title: "Android",
    blurb: "Revol in your pocket. Allow installs from unknown sources.",
    match: (a) => a.name.endsWith(".apk"),
    fallbackNote: "APK coming shortly",
  },
  {
    key: "mac",
    icon: AppleIcon,
    title: "macOS & iOS",
    blurb: "The story continues on Apple platforms.",
    match: (a) => a.name.endsWith(".dmg") || a.name.endsWith(".ipa"),
    fallbackNote: "Coming soon",
  },
];

export function DownloadScreen() {
  const navigate = useNavigate();
  const detected = detectPlatform();

  const { data, isLoading } = useQuery({
    queryKey: ["latest-release"],
    queryFn: async (): Promise<Release> => {
      const res = await fetch(RELEASES_API, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) throw new Error("release fetch failed");
      return res.json() as Promise<Release>;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return (
    <div className="min-h-full bg-black text-ivory">
      <NavBar />

      <section className="relative overflow-hidden px-6 pt-40 pb-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,rgb(255_0_46/0.1),transparent_70%)]"
        />
        <Reveal>
          <Stack gap={4} className="items-center">
            <Text variant="label" tone="gold">
              Get Revol
            </Text>
            <Heading level={1} className="max-w-2xl">
              One story. <span className="italic text-gold">Every screen.</span>
            </Heading>
            <Text variant="body" tone="dim" className="max-w-lg leading-relaxed">
              The same cinematic experience on desktop, mobile and web — with updates that arrive on their own.
            </Text>
            {data && (
              <Text variant="caption" tone="dim">
                Latest release {data.tag_name} · {new Date(data.published_at).toLocaleDateString()}
              </Text>
            )}
          </Stack>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <Grid gap={6} className="grid-cols-1 md:grid-cols-3">
          {platforms.map((p, i) => {
            const asset = data?.assets.find(p.match);
            const recommended =
              (p.key === "windows" && detected === "windows") ||
              (p.key === "android" && detected === "android") ||
              (p.key === "mac" && detected === "mac");
            return (
              <Reveal key={p.key} delay={i * 120}>
                <Card variant={recommended ? "gold" : "default"} className="flex h-full flex-col">
                  <Stack gap={4} className="flex-1">
                    <span className="flex size-12 items-center justify-center rounded-full border border-gold/30 text-gold">
                      <p.icon size={24} />
                    </span>
                    <Stack gap={1}>
                      <Heading level={4}>{p.title}</Heading>
                      {recommended && (
                        <Text variant="label" tone="gold">
                          Recommended for you
                        </Text>
                      )}
                    </Stack>
                    <Text variant="caption" tone="dim" className="flex-1 leading-relaxed">
                      {p.blurb}
                    </Text>
                    {isLoading ? (
                      <Skeleton className="h-11 w-full rounded-full" />
                    ) : asset ? (
                      <Stack gap={2}>
                        <Button
                          fullWidth
                          variant={recommended ? "gold" : "primary"}
                          onPress={() => window.open(asset.browser_download_url, "_blank")}
                        >
                          <DownloadIcon size={16} />
                          Download
                        </Button>
                        <Text variant="caption" tone="dim" className="text-center">
                          {asset.name} · {formatSize(asset.size)}
                        </Text>
                      </Stack>
                    ) : (
                      <Button fullWidth variant="outline" disabled>
                        {p.fallbackNote}
                      </Button>
                    )}
                  </Stack>
                </Card>
              </Reveal>
            );
          })}
        </Grid>

        <Reveal delay={300}>
          <Card className="mt-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <Stack gap={1} className="items-center md:items-start">
                <div className="flex items-center gap-3">
                  <GlobeIcon size={20} className="text-gold" />
                  <Heading level={4}>Use it on the web</Heading>
                </div>
                <Text variant="caption" tone="dim">
                  No install needed — the full experience, right here.
                </Text>
              </Stack>
              <Button variant="outline" onPress={() => void navigate("/auth/sign-up")}>
                Open Revol
                <ArrowRightIcon size={16} />
              </Button>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={400}>
          <Text variant="caption" tone="dim" className="mt-8 block text-center">
            All builds are published on{" "}
            <a
              href={RELEASES_PAGE}
              target="_blank"
              rel="noreferrer"
              className="text-gold no-underline transition-colors duration-base hover:text-gold-soft"
            >
              GitHub Releases
            </a>
            . Desktop updates itself; Android prompts when a new version ships.
          </Text>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
