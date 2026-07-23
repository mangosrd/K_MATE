"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/map", key: "map", icon: "🗺️" },
    { href: "/learn/kyuhyun", key: "learn", icon: "📖" },
    { href: "/chat", key: "chat", icon: "💬" },
    { href: "/vocab", key: "vocab", icon: "📚" },
    { href: "/me", key: "me", icon: "👤" },
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => {
        const baseHref = item.href === "/learn/kyuhyun" ? "/learn" : item.href;
        const isActive = pathname.startsWith(baseHref);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive ? " active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="nav-icon" role="img" aria-hidden="true">{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
