import { Screen, Text } from "@/components/ui";
import { InfinityHeartIcon } from "@/components/icons";

/** Entry screen — brand moment. Auth routing replaces the CTA in Epic 2. */
export function SplashScreen() {
  return (
    <Screen centered>
      <InfinityHeartIcon size={72} className="text-crimson animate-[revol-float_4s_ease-in-out_infinite]" />
      <Text variant="display" tone="gold" className="mt-8 animate-[revol-blur-reveal_1.2s_var(--ease-reveal)]">
        revol
      </Text>
      <Text variant="label" tone="dim" className="mt-4 animate-[revol-fade-in_2s_var(--ease-elegant)]">
        Infinite Chemistry
      </Text>
    </Screen>
  );
}
