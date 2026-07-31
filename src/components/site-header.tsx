import Link from "next/link";

const links = [
  { href: "/programs", label: "Programs" },
  { href: "/credentials", label: "Credentials" },
  { href: "/plan", label: "My plan" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          WGU Certs
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
