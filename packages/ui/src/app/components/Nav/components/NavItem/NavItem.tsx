import { FC, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import './NavItem.scss';
import cn from 'classnames';

interface NavItemProps {
  to: string;
  children: ReactNode;
}

export const NavItem: FC<NavItemProps> = ({ to, children }) => {
  return (
    <li>
      <NavLink to={to} className={({ isActive }) => cn('nav-item', { active: isActive })}>
        <span className="nav-item-label">{children}</span>
      </NavLink>
    </li>
  );
};
