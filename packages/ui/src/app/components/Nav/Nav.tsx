import { FC } from 'react';
import { NavItem } from './components/NavItem';
import './Nav.scss';

export const Nav: FC = () => {
  return (
    <nav>
      <ul>
        <NavItem to="/">Export</NavItem>
        <NavItem to="/setup">Setup</NavItem>
        <NavItem to="/about">About</NavItem>
        {__DEV__ ? <NavItem to="/components">Components</NavItem> : null}
      </ul>
    </nav>
  );
};
