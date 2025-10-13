import { FC } from 'react';
import { Card } from '../../components/Card';
import wordmarkUrl from '../../../../assets/bitovi-wordmark.png';

export const About: FC = () => {
  const handleLinkClick = (url: string) => {
    // For now, these are placeholder - user can integrate proper URLs later
    console.log('Navigate to:', url);
  };

  return (
    <div className="about-container">
      <div className="about-content">
        <div className="about-text">
          <div className="about-description">
            <p>
              Eggstractor is an open source project for exporting design as tokens and utility
              layers, letting developers build components their way, while supporting ultra-fast,
              designer-led code updates to styling.
            </p>
            <p>
              By separating structure from styling, Eggstractor ensures that design changes don't
              disrupt component architecture. And with automated code generation for updates,
              designers can take control of their styling updates, allowing for instantaneous design
              QA and freeing up developers (who now only need to review a PR for styling changes).
            </p>
            <p>Eggstractor is an open source project by Bitovi.</p>
            <p>Need some help?</p>
          </div>

          <div className="about-links">
            <a onClick={() => handleLinkClick('https://discord.gg/bitovi')}>
              Chat with us on Discord
            </a>
            <span className="link-separator">•</span>
            <a onClick={() => handleLinkClick('https://github.com/bitovi/eggstractor/issues')}>
              Request features
            </a>
            <span className="link-separator">•</span>
            <a onClick={() => handleLinkClick('mailto:contact@bitovi.com')}>Email</a>
          </div>

          <div className="about-cta">
            <span>Need pros to help design & build your design system or app?</span>
            <a onClick={() => handleLinkClick('https://bitovi.com')}>That's us!</a>
          </div>
        </div>

        <img src={wordmarkUrl} alt="Bitovi" className="bitovi-wordmark" />

        <Card className="getting-started-card">
          <h3>Not sure where to start?</h3>
          <p>
            The Getting Started Guide will walk you through the steps for setting up a demo project
            where you can test it all out.
          </p>
          <a
            onClick={() => handleLinkClick('https://github.com/bitovi/eggstractor#getting-started')}
          >
            View the guide →
          </a>
        </Card>
      </div>
    </div>
  );
};
