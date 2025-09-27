import { FC } from 'react';
import { NavLink } from 'react-router-dom';

export const Nav: FC = () => {
  return (
    <nav className="navigation">
      <ul>
        <li>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'active-link' : 'inactive-link')}
          >
            Export
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? 'active-link' : 'inactive-link')}
          >
            About
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};
