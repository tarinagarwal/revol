import { Link } from "react-router-dom";
import { Divider } from "@/components/ui";
import { InfinityHeartIcon } from "@/components/icons";

const columns: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", to: "/" },
      { label: "Chemistry", to: "/" },
      { label: "Premium", to: "/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/" },
      { label: "Careers", to: "/" },
      { label: "Press", to: "/" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Safety", to: "/" },
      { label: "Privacy", to: "/" },
      { label: "Terms", to: "/" },
    ],
  },
];

/** Site footer — brand essence, link columns, quiet elegance. */
export function Footer() {
  return (
    <footer className="border-t border-charcoal bg-black px-6 pt-16 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="flex max-w-sm flex-col gap-4">
            <span className="flex items-center gap-3">
              <InfinityHeartIcon size={28} className="text-crimson" />
              <span className="font-display text-lg tracking-cinematic uppercase text-gold">revol</span>
            </span>
            <span className="font-body text-sm leading-relaxed text-ivory-dim">
              Where emotional intelligence, mystery, and attraction converge. A dating experience designed for
              meaningful discovery.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title} className="flex flex-col gap-3">
                <span className="font-body text-xs tracking-elegant uppercase text-gold">{col.title}</span>
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="font-body text-sm text-ivory-dim no-underline transition-colors duration-base ease-elegant hover:text-ivory"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <Divider className="my-10" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <span className="font-body text-xs text-ivory-dim">
            © {new Date().getFullYear()} Revol. All rights reserved.
          </span>
          <span className="font-display text-sm italic text-ivory-dim">Chemistry before clarity.</span>
        </div>
      </div>
    </footer>
  );
}
