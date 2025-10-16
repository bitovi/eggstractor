import { FC } from 'react';
import cn from 'classnames';
import wordmarkUrl from '../../../../assets/bitovi-wordmark.png';
import styles from './About.module.scss';
import { Card } from '../../components';

export const About: FC = () => {
  return (
    <div className={cn('container', styles.about)}>
      <p className={styles.p}>
        Eggstractor is an open source project for exporting design as tokens and utility layers,
        letting developers build components their way, while supporting ultra-fast, designer-led
        code updates to styling.
      </p>
      <p className={styles.p}>
        By separating structure from styling, Eggstractor ensures that design changes don't disrupt
        component architecture. And with automated code generation for updates, designers can take
        control of their styling updates, allowing for instantaneous design QA and freeing up
        developers (who now only need to review a PR for styling changes).
      </p>
      <p className={styles.p}>Eggstractor is an open source project by Bitovi.</p>
      <p className={styles.p}>
        Need some help?
        <br />
        <a className={styles.link}>Chat with us on Discord</a> •{' '}
        <a className={styles.link}>Send feature requests</a> •{' '}
        <a className={styles.link}>Email us</a>
      </p>
      <p className={styles.last}>
        Need pros to help design & build your design system or app?{' '}
        <a className={styles.link}>That's us!</a>
      </p>
      <img className={styles.img} src={wordmarkUrl} alt="Bitovi" />
      <Card
        title="Not sure where to start?"
        type="static"
        linkHref="https://bitovi.com"
        linkLabel="View the guide"
      >
        The Getting Started Guide will walk you through the steps for setting up a demo project
        where you can test it all out.
      </Card>
    </div>
  );
};
