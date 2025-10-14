import { FC } from 'react';
import wordmarkUrl from '../../../../assets/bitovi-wordmark.png';
import styles from './About.module.scss';

export const About: FC = () => {
  return (
    <div className="about container">
      <p>
        Eggstractor is an open source project for exporting design as tokens and utility layers,
        letting developers build components their way, while supporting ultra-fast, designer-led
        code updates to styling.
      </p>
      <p>
        By separating structure from styling, Eggstractor ensures that design changes don’t disrupt
        component architecture. And with automated code generation for updates, designers can take
        control of their styling updates, allowing for instantaneous design QA and freeing up
        developers (who now only need to review a PR for styling changes).
      </p>
      <p>Eggstractor is an open source project by Bitovi.</p>
      <p>
        Need some help?
        <br />
        <a>Chat with us on Discord</a> • <a>Send feature requests</a> • <a>Email us</a>
      </p>
      <p className="last">
        Need pros to help design & build your design system or app? <a>That's us!</a>
      </p>
      <img src={wordmarkUrl} alt="Bitovi" />
    </div>
  );
};
