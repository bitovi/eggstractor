import { FC } from 'react';
import { NavLink } from 'react-router-dom';

interface NavItemProps {
  to: string;
  children: React.ReactNode;
}

const NavItem: FC<NavItemProps> = ({ to, children }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `nav-item ${isActive ? 'nav-item--selected' : 'nav-item--unselected'}`
      }
    >
      {children}
    </NavLink>
  );
};

export const Nav: FC = () => {
  return (
    <nav className="navigation">
      <NavItem to="/">Export</NavItem>
      <NavItem to="/setup">Setup</NavItem>
      <NavItem to="/about">About</NavItem>
    </nav>
  );
};
