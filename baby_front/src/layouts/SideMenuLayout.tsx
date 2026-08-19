import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface SideMenuItem {
  label: string;
  to: string;
}

interface SideMenuLayoutProps {
  items: SideMenuItem[];
  children: ReactNode;
  className?: string;
}

const SideMenuLayout = ({
  items,
  children,
  className,
}: SideMenuLayoutProps) => {
  const { pathname } = useLocation();

  const activeTo = items
    .filter((item) => pathname.startsWith(item.to))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;

  return (
    <div className={`side-menu-layout${className ? ` ${className}` : ""}`}>
      <nav className="side-menu">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`side-menu-item${item.to === activeTo ? " active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="side-menu-content">{children}</div>
    </div>
  );
};

export default SideMenuLayout;
