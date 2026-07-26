import { useNavigate } from "react-router-dom";
import { Button, Card, Heading, Text, Reveal, Stack, Grid, Divider } from "@/components/ui";
import {
  InfinityHeartIcon,
  EyeOffIcon,
  SparkIcon,
  HeartIcon,
  ShieldIcon,
  ChatIcon,
  MicIcon,
  ArrowRightIcon,
  InfinityIcon,
} from "@/components/icons";
import { NavBar } from "@/components/layout/NavBar";
import { Footer } from "@/components/layout/Footer";

const pillars = [
  {
    icon: EyeOffIcon,
    title: "Mystery",
    body: "Profiles begin blurred. Attraction builds through discovery, not instant judgment.",
  },
  {
    icon: SparkIcon,
    title: "Compatibility",
    body: "AI reads beneath the surface — values, intent, emotional rhythm — and explains why you match.",
  },
  {
    icon: HeartIcon,
    title: "Intention",
    body: "One meaningful match at a time. Conversation quality unlocks the reveal.",
  },
];

const steps = [
  { n: "01", title: "Go deeper than photos", body: "A depth-first onboarding captures who you are — personality, values, voice." },
  { n: "02", title: "Meet your match, veiled", body: "We introduce one deeply compatible person. Their face stays a mystery." },
  { n: "03", title: "Let chemistry lead", body: "Talk. Voice notes, real questions, AI-guided sparks. The blur fades as connection grows." },
  { n: "04", title: "The reveal", body: "When the conversation earns it, you see each other — already connected." },
];

/** Marketing home — cinematic hero, pillars, how-it-works, CTA. */
export function HomeScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-full bg-black text-ivory">
      <NavBar />

      {/* Hero */}
      <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_35%,rgb(255_0_46/0.12),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_50%_80%,rgb(212_166_74/0.08),transparent_70%)]"
        />
        <Reveal>
          <InfinityHeartIcon
            size={64}
            className="mx-auto mb-10 text-crimson animate-[revol-float_5s_ease-in-out_infinite]"
          />
        </Reveal>
        <Reveal delay={150}>
          <Heading level={1} className="max-w-3xl">
            Attraction starts <span className="italic text-gold">before</span> appearance.
          </Heading>
        </Reveal>
        <Reveal delay={350}>
          <Text variant="body" tone="dim" className="mt-6 block max-w-xl text-lg leading-relaxed">
            Revol is AI-guided dating built on emotional compatibility. Profiles stay veiled while chemistry does the
            talking — because the right connection deserves more than a swipe.
          </Text>
        </Reveal>
        <Reveal delay={550}>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button size="lg" onPress={() => navigate("/test-ui")}>
              Begin the story
            </Button>
            <Button size="lg" variant="outline" onPress={() => navigate("/test-ui")}>
              How it works
            </Button>
          </div>
        </Reveal>
        <Reveal delay={800} className="absolute bottom-10">
          <Text variant="label" tone="dim">
            Chemistry before clarity
          </Text>
        </Reveal>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <Stack gap={3} className="mb-14 items-center text-center">
            <Text variant="label" tone="gold">
              The Revol difference
            </Text>
            <Heading level={2}>Built for deeper connection</Heading>
          </Stack>
        </Reveal>
        <Grid gap={6} className="grid-cols-1 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 150}>
              <Card className="h-full">
                <Stack gap={4}>
                  <span className="flex size-12 items-center justify-center rounded-full border border-gold/30 text-gold">
                    <p.icon size={22} />
                  </span>
                  <Heading level={3}>{p.title}</Heading>
                  <Text variant="body" tone="dim" className="leading-relaxed">
                    {p.body}
                  </Text>
                </Stack>
              </Card>
            </Reveal>
          ))}
        </Grid>
      </section>

      {/* How it works */}
      <section className="border-y border-charcoal bg-rich-black/50 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <Stack gap={3} className="mb-14 items-center text-center">
              <Text variant="label" tone="gold">
                The journey
              </Text>
              <Heading level={2}>Slow is the new spark</Heading>
            </Stack>
          </Reveal>
          <Stack gap={0}>
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="flex gap-6 py-8 md:gap-10">
                  <span className="font-display text-3xl text-crimson/70">{s.n}</span>
                  <Stack gap={2}>
                    <Heading level={4}>{s.title}</Heading>
                    <Text variant="body" tone="dim" className="leading-relaxed">
                      {s.body}
                    </Text>
                  </Stack>
                </div>
                {i < steps.length - 1 && <Divider />}
              </Reveal>
            ))}
          </Stack>
        </div>
      </section>

      {/* Signals row */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Grid gap={6} className="grid-cols-2 md:grid-cols-4">
          {[
            { icon: ChatIcon, label: "AI icebreakers" },
            { icon: MicIcon, label: "Voice-first intimacy" },
            { icon: ShieldIcon, label: "Verified & private" },
            { icon: InfinityIcon, label: "Infinite chemistry" },
          ].map((f, i) => (
            <Reveal key={f.label} delay={i * 100}>
              <Stack gap={3} className="items-center py-6 text-center">
                <f.icon size={26} className="text-gold" />
                <Text variant="caption" tone="dim">
                  {f.label}
                </Text>
              </Stack>
            </Reveal>
          ))}
        </Grid>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden border-t border-charcoal px-6 py-28 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,rgb(255_0_46/0.1),transparent_70%)]"
        />
        <Reveal>
          <Stack gap={6} className="items-center">
            <Heading level={2} className="max-w-2xl">
              We don't make matches. <span className="italic text-gold">We unlock connection.</span>
            </Heading>
            <Button size="lg" onPress={() => navigate("/test-ui")}>
              Join Revol
              <ArrowRightIcon size={18} />
            </Button>
          </Stack>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
