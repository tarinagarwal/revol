import { useState } from "react";
import {
  AppHeader,
  Avatar,
  BlurImage,
  Button,
  Card,
  Checkbox,
  Divider,
  Drawer,
  EmptyState,
  ErrorState,
  Grid,
  Heading,
  IconButton,
  ImageFrame,
  Input,
  Modal,
  Popover,
  ProgressBar,
  RadioGroup,
  Reveal,
  Row,
  Select,
  Sheet,
  Skeleton,
  Spinner,
  Stack,
  TabBar,
  Text,
  TextArea,
  Toggle,
  Tooltip,
  toast,
} from "@/components/ui";
import * as Icons from "@/components/icons";
import { NavBar } from "@/components/layout/NavBar";
import { Footer } from "@/components/layout/Footer";

const IMG = "https://picsum.photos/seed/revol1/600/800";
const IMG2 = "https://picsum.photos/seed/revol2/600/600";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <Stack gap={6} className="py-10">
        <Row gap={4}>
          <Heading level={3} tone="gold">
            {title}
          </Heading>
          <Divider className="flex-1" />
        </Row>
        {children}
      </Stack>
    </Reveal>
  );
}

/** /test-ui — every component in the kit, live and interactive. */
export function TestUIScreen() {
  const [inputVal, setInputVal] = useState("");
  const [areaVal, setAreaVal] = useState("");
  const [selectVal, setSelectVal] = useState<string | undefined>(undefined);
  const [checked, setChecked] = useState(true);
  const [toggled, setToggled] = useState(false);
  const [radio, setRadio] = useState("serious");
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [blurLevel, setBlurLevel] = useState<0 | 1 | 2 | 3>(3);
  const [progress, setProgress] = useState(64);

  const iconEntries = Object.entries(Icons).filter(([name]) => name.endsWith("Icon")) as Array<
    [string, React.ComponentType<Icons.IconProps>]
  >;

  return (
    <div className="min-h-full bg-black pb-32 text-ivory">
      <NavBar />
      <div className="mx-auto max-w-5xl px-6 pt-32">
        <Stack gap={2} className="mb-6">
          <Heading level={1}>UI Kit</Heading>
          <Text tone="dim">Every Revol primitive, live. Dark cinematic, zero default HTML, zero emoji.</Text>
        </Stack>

        <Section title="Typography">
          <Stack gap={4}>
            <Heading level={1}>Display One — Playfair</Heading>
            <Heading level={2}>Heading Two</Heading>
            <Heading level={3}>Heading Three</Heading>
            <Heading level={4}>Heading Four</Heading>
            <Text variant="display" tone="gold">display text</Text>
            <Text variant="heading">Heading text variant</Text>
            <Text variant="body">Body — Inter. The quick crimson fox leaps beyond the swipe.</Text>
            <Text variant="caption" tone="dim">Caption — quiet supporting copy.</Text>
            <Text variant="label" tone="gold">Label — tracked uppercase</Text>
          </Stack>
        </Section>

        <Section title="Buttons">
          <Row gap={4} className="flex-wrap">
            <Button>Primary</Button>
            <Button variant="gold">Gold</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
          </Row>
          <Row gap={4} className="flex-wrap">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Row gap={4}>
            <IconButton label="Like" variant="solid">
              <Icons.HeartIcon size={20} />
            </IconButton>
            <IconButton label="Settings" variant="outline">
              <Icons.SettingsIcon size={20} />
            </IconButton>
            <IconButton label="Notifications">
              <Icons.BellIcon size={20} />
            </IconButton>
          </Row>
        </Section>

        <Section title="Form Controls">
          <Grid gap={8} className="grid-cols-1 md:grid-cols-2">
            <Stack gap={6}>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                leading={<Icons.UserIcon size={18} />}
                hint="We never show this publicly."
              />
              <Input label="Password" type="password" placeholder="Your secret" trailing={<Icons.EyeIcon size={18} />} />
              <Input label="With error" placeholder="Something wrong" error="This field needs attention." />
              <TextArea
                label="About you"
                placeholder="Beyond the surface..."
                value={areaVal}
                onChange={(e) => setAreaVal(e.target.value)}
              />
            </Stack>
            <Stack gap={6}>
              <Select
                label="Looking for"
                placeholder="Choose intent"
                options={[
                  { value: "serious", label: "Something real" },
                  { value: "slow", label: "Slow discovery" },
                  { value: "curious", label: "Curious for now" },
                ]}
                value={selectVal ?? ""}
                onChange={setSelectVal}
              />
              <Checkbox label="Show me verified profiles only" checked={checked} onChange={setChecked} />
              <Toggle label="Mystery mode" checked={toggled} onChange={setToggled} />
              <RadioGroup
                label="Intent"
                value={radio}
                onChange={setRadio}
                options={[
                  { value: "serious", label: "Long-term", description: "Building something that lasts" },
                  { value: "open", label: "Open to discovery", description: "Let chemistry decide" },
                ]}
              />
            </Stack>
          </Grid>
        </Section>

        <Section title="Surfaces">
          <Grid gap={6} className="grid-cols-1 md:grid-cols-3">
            <Card>
              <Stack gap={2}>
                <Heading level={4}>Default card</Heading>
                <Text variant="caption" tone="dim">Quiet charcoal border.</Text>
              </Stack>
            </Card>
            <Card variant="gold">
              <Stack gap={2}>
                <Heading level={4} tone="gold">Premium card</Heading>
                <Text variant="caption" tone="dim">Gold frame + glow.</Text>
              </Stack>
            </Card>
            <Card variant="glow" onPress={() => toast("Card pressed", "info")}>
              <Stack gap={2}>
                <Heading level={4} tone="crimson">Glow card</Heading>
                <Text variant="caption" tone="dim">Pressable — try me.</Text>
              </Stack>
            </Card>
          </Grid>
          <Row gap={4} className="flex-wrap">
            <Button variant="outline" onPress={() => setModalOpen(true)}>Open Modal</Button>
            <Button variant="outline" onPress={() => setSheetOpen(true)}>Open Sheet</Button>
            <Button variant="outline" onPress={() => setDrawerOpen(true)}>Open Drawer</Button>
            <Button variant="outline" onPress={() => toast("A quiet gold whisper", "success")}>Success toast</Button>
            <Button variant="outline" onPress={() => toast("Something felt off", "error")}>Error toast</Button>
            <Tooltip content="Soft hover hint">
              <Button variant="ghost">Hover for tooltip</Button>
            </Tooltip>
            <Popover
              trigger={
                <span className="inline-flex items-center gap-2 rounded-full border border-charcoal px-5 py-2 font-body text-sm text-ivory transition-colors duration-base hover:border-gold">
                  Popover
                  <Icons.ChevronDownIcon size={14} />
                </span>
              }
            >
              <Stack gap={1}>
                {["Report", "Block", "Unmatch"].map((a) => (
                  <Button key={a} variant="ghost" size="sm" fullWidth onPress={() => toast(`${a} pressed`)}>
                    {a}
                  </Button>
                ))}
              </Stack>
            </Popover>
          </Row>
        </Section>

        <Section title="Feedback">
          <Row gap={8} className="flex-wrap">
            <Spinner size={28} />
            <Spinner size={28} tone="crimson" />
            <Spinner size={28} tone="ivory" />
          </Row>
          <Grid gap={4} className="grid-cols-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="size-12 rounded-full" />
          </Grid>
          <Stack gap={4}>
            <ProgressBar value={progress} label="Chemistry" />
            <ProgressBar value={progress / 2} tone="crimson" label="Reveal progress" />
            <Row gap={4}>
              <Button size="sm" variant="outline" onPress={() => setProgress((p) => Math.max(0, p - 10))}>Less</Button>
              <Button size="sm" variant="outline" onPress={() => setProgress((p) => Math.min(100, p + 10))}>More</Button>
            </Row>
          </Stack>
          <Grid gap={6} className="grid-cols-1 md:grid-cols-2">
            <Card padded={false}>
              <EmptyState
                title="No matches yet"
                description="Your story is still being written. Check back soon."
                action={<Button size="sm" variant="gold">Refresh</Button>}
              />
            </Card>
            <Card padded={false}>
              <ErrorState
                title="Connection lost"
                description="The server slipped into the shadows."
                action={<Button size="sm" variant="outline">Retry</Button>}
              />
            </Card>
          </Grid>
        </Section>

        <Section title="Media & Reveal Mechanic">
          <Row gap={6} className="flex-wrap">
            <Avatar name="Aria Voss" size="sm" />
            <Avatar name="Aria Voss" size="md" src={IMG2} />
            <Avatar name="Aria Voss" size="lg" src={IMG2} ring="gold" />
            <Avatar name="Aria Voss" size="xl" src={IMG2} ring="glow" blurred />
          </Row>
          <Grid gap={6} className="grid-cols-1 md:grid-cols-3">
            <Stack gap={4}>
              <BlurImage src={IMG} alt="Profile" blurLevel={blurLevel} />
              <Row gap={2}>
                {([3, 2, 1, 0] as const).map((lvl) => (
                  <Button
                    key={lvl}
                    size="sm"
                    variant={blurLevel === lvl ? "primary" : "outline"}
                    onPress={() => setBlurLevel(lvl)}
                  >
                    {lvl === 0 ? "Reveal" : `Level ${lvl}`}
                  </Button>
                ))}
              </Row>
            </Stack>
            <ImageFrame src={IMG2} alt="Framed" aspect="square" frame="gold" />
            <ImageFrame src={IMG} alt="Framed portrait" aspect="portrait" />
          </Grid>
        </Section>

        <Section title="Navigation">
          <Card padded={false} className="overflow-hidden">
            <AppHeader
              title="Your Match"
              showBack
              right={
                <IconButton label="Settings">
                  <Icons.SettingsIcon size={20} />
                </IconButton>
              }
              className="static"
            />
            <div className="p-6">
              <Text variant="caption" tone="dim">AppHeader + BackButton demo (static placement).</Text>
            </div>
          </Card>
          <Text variant="caption" tone="dim">TabBar renders fixed at the viewport bottom — live below.</Text>
        </Section>

        <Section title="Icon Library">
          <Grid gap={4} className="grid-cols-4 sm:grid-cols-6 md:grid-cols-8">
            {iconEntries.map(([name, IconComp]) => (
              <Tooltip key={name} content={name}>
                <Card padded={false} className="flex aspect-square w-full items-center justify-center text-ivory-dim hover:text-gold">
                  <IconComp size={22} />
                </Card>
              </Tooltip>
            ))}
          </Grid>
        </Section>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="A quiet moment">
        <Stack gap={4}>
          <Text tone="dim">Modals blur the world behind them. ESC or backdrop closes.</Text>
          <Row gap={3} className="justify-end">
            <Button variant="ghost" onPress={() => setModalOpen(false)}>Cancel</Button>
            <Button onPress={() => { setModalOpen(false); toast("Confirmed", "success"); }}>Confirm</Button>
          </Row>
        </Stack>
      </Modal>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Stack gap={4}>
          <Heading level={4}>Bottom sheet</Heading>
          <Text tone="dim">Mobile-first surface for filters, reports, quick actions.</Text>
          <Button fullWidth onPress={() => setSheetOpen(false)}>Done</Button>
        </Stack>
      </Sheet>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Stack gap={4}>
          <Heading level={4}>Drawer</Heading>
          <Text tone="dim">Side panel for navigation or detail.</Text>
          <Button variant="outline" fullWidth onPress={() => setDrawerOpen(false)}>Close</Button>
        </Stack>
      </Drawer>

      <TabBar
        items={[
          { path: "/", label: "Home", icon: Icons.HomeIcon },
          { path: "/test-ui", label: "Kit", icon: Icons.SparkIcon },
          { path: "/chat-demo", label: "Chat", icon: Icons.ChatIcon },
          { path: "/profile-demo", label: "You", icon: Icons.UserIcon },
        ]}
      />
      <div className="mt-24">
        <Footer />
      </div>
    </div>
  );
}
