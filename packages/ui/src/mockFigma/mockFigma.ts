import { MessageToMainThreadPayload, MessageToUIPayload } from '@eggstractor/common';
import { isFigmaPluginUI } from '../app/utils';

/**
 * Add `message` event listener to simulate Figma plugin environment.
 */
export const mockFigma = () => {
  if (isFigmaPluginUI()) return; // don't run inside Figma

  // // To match dark mode in Figma
  // document.body.style.backgroundColor = '#2c2c2c';

  const mockPostMessageToUI = (message: MessageToUIPayload) => {
    window.postMessage({ pluginMessage: message }, '*');
  };

  const onMessage = (event: MessageEvent<{ pluginMessage: MessageToMainThreadPayload }>) => {
    if (!event.data.pluginMessage) return;

    const message = event.data.pluginMessage;

    if (message.type === 'load-config') {
      console.info('mockFigma: load-config message received');
      setTimeout(() => {
        mockPostMessageToUI({
          type: 'config-loaded',
          config: {
            provider: 'github',
            repoPath: 'mock-repo-path',
            branchName: 'mock-branch-name',
            authToken: 'mock-auth-token',
            format: 'scss',
            filePath: 'styles/eggstracted.scss',
            useCombinatorialParsing: true,
          },
        });
      }, 500);
    } else if (message.type === 'generate-styles') {
      setTimeout(() => {
        mockPostMessageToUI({ type: 'progress-start' });
      }, 200);

      setTimeout(() => {
        mockPostMessageToUI({
          type: 'progress-update',
          progress: 0,
          message: 'Loading pages...',
          id: 1,
        });
      }, 400);

      setTimeout(() => {
        mockPostMessageToUI({
          type: 'progress-update',
          progress: 45,
          message: 'Processing nodes… 19/45',
          id: 3,
        });
      }, 600);

      setTimeout(() => {
        mockPostMessageToUI({
          type: 'progress-update',
          progress: 95,
          message: 'Transforming…',
          id: 4,
        });
      }, 800);

      setTimeout(() => {
        mockPostMessageToUI({
          type: 'progress-end',
        });
      }, 1000);

      setTimeout(() => {
        mockPostMessageToUI({
          type: 'output-styles',
          styles: `// Generated SCSS Variables (${message.format} ${message.type} ${message.useCombinatorialParsing})\n$base-size-xs: 0.125rem;\n$base-colour-grey-400: #282828;\n$base-font-size-xl: 1.25rem;\n$global-font-uidefaultfont: inter;\n$base-font-linespacing-lg: 1.5rem;\n$base-font-weight-semibold: 31.25rem;\n$base-colour-static-white: #ffffff;\n$base-size-lg: 0.75rem;\n$base-radius-sm: 0.25rem;\n$global-size-border-width: 0.062rem;\n$base-colour-grey-100: #d9d9d9;\n$global-colour-textonlight: #282828;\n$base-font-weight-regular: 25rem;\n$base-colour-grey-300: #747474;\n$base-colour-blue-300: #0177cc;\n$global-colour-action-background: #cd0087;\n$base-size-2xl: 1.5rem;\n$component-button-border-width-resting: 0.062rem;\n$global-colour-action-textonbg: #ffffff;\n$component-button-icon-width-resting: 1.5rem;\n$component-button-icon-height-resting: 1.5rem;\n$component-button-icon-colour-resting: #ffffff;\n$base-colour-static-black: #000000;\n$base-colour-static-black-50: rgba(0, 0, 0, 0.5);\n$base-colour-static-black-30: rgba(0, 0, 0, 0.30000001192092896);\n$base-colour-static-black-10: rgba(0, 0, 0, 0.10000000149011612);\n$base-colour-static-transparent: rgba(255, 255, 255, 0);\n$base-colour-blue-400: #00294c;\n$base-colour-pink-400: #4d0030;\n$base-colour-pink-300: #cd0087;\n$base-colour-grey-200: #bfbfbf;\n$base-colour-blue-200: #8bc4ff;\n$base-colour-pink-200: #ff9acb;\n$base-colour-blue-100: #bdddff;\n$base-colour-pink-100: #ffc6e0;\n\n// Generated SCSS Mixins\n@mixin input-resting {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: $base-size-xs;\n  padding: 0rem;\n  width: 15.937rem;\n}\n@mixin input-label-resting {\n  display: flex;\n  flex-direction: column;\n  color: $base-colour-grey-400;\n  font-family: $global-font-uidefaultfont;\n  font-size: $base-font-size-xl;\n  font-weight: 500;\n  font-style: normal;\n  line-height: $base-font-linespacing-lg;\n  width: 15.937rem;\n}\n@mixin input-input-box-resting {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  gap: $base-size-lg;\n  padding: 0.687rem $base-size-lg;\n  background: $base-colour-static-white;\n  width: 15.937rem;\n  border: $global-size-border-width solid $base-colour-grey-100;\n  box-shadow: inset 0 $global-size-border-width 0 0 $base-colour-grey-100, inset (-$global-size-border-width) 0 0 0 $base-colour-grey-100, inset 0 (-$global-size-border-width) 0 0 $base-colour-grey-100, inset $global-size-border-width 0 0 0 $base-colour-grey-100;\n  border-radius: $base-radius-sm;\n}\n@mixin input-input-box-input-text-resting {\n  display: flex;\n  flex-direction: column;\n  color: $global-colour-textonlight;\n  font-family: $global-font-uidefaultfont;\n  font-size: 1rem;\n  font-weight: 400;\n  font-style: normal;\n  line-height: 20px;\n  width: 14.437rem;\n}\n@mixin input-hover {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: $base-size-xs;\n  padding: 0rem;\n  width: 15.937rem;\n}\n@mixin input-label-hover {\n  display: flex;\n  flex-direction: column;\n  color: $base-colour-grey-400;\n  font-family: $global-font-uidefaultfont;\n  font-size: $base-font-size-xl;\n  font-weight: 500;\n  font-style: normal;\n  line-height: $base-font-linespacing-lg;\n  width: 15.937rem;\n}\n@mixin input-input-box-hover {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  gap: $base-size-lg;\n  padding: 0.687rem $base-size-lg;\n  background: $base-colour-static-white;\n  width: 15.937rem;\n  border: $global-size-border-width solid $base-colour-grey-300;\n  box-shadow: inset 0 $global-size-border-width 0 0 $base-colour-grey-300, inset (-$global-size-border-width) 0 0 0 $base-colour-grey-300, inset 0 (-$global-size-border-width) 0 0 $base-colour-grey-300, inset $global-size-border-width 0 0 0 $base-colour-grey-300;\n  border-radius: $base-radius-sm;\n}\n@mixin input-input-box-input-text-hover {\n  display: flex;\n  flex-direction: column;\n  color: $global-colour-textonlight;\n  font-family: $global-font-uidefaultfont;\n  font-size: 1rem;\n  font-weight: 400;\n  font-style: normal;\n  line-height: 20px;\n  width: 14.437rem;\n}\n@mixin input-active {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: $base-size-xs;\n  padding: 0rem;\n  width: 15.937rem;\n}\n@mixin input-label-active {\n  display: flex;\n  flex-direction: column;\n  color: $base-colour-blue-300;\n  font-family: $global-font-uidefaultfont;\n  font-size: $base-font-size-xl;\n  font-weight: 500;\n  font-style: normal;\n  line-height: $base-font-linespacing-lg;\n  width: 15.937rem;\n}\n@mixin input-input-box-active {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  gap: $base-size-lg;\n  padding: 0.687rem $base-size-lg;\n  background: $base-colour-static-white;\n  width: 15.937rem;\n  border: 0.125rem solid $base-colour-blue-300;\n  box-shadow: inset 0 0.125rem 0 0 $base-colour-blue-300, inset -0.125rem 0 0 0 $base-colour-blue-300, inset 0 -0.125rem 0 0 $base-colour-blue-300, inset 0.125rem 0 0 0 $base-colour-blue-300;\n  border-radius: $base-radius-sm;\n}\n@mixin input-input-box-input-text-active {\n  display: flex;\n  flex-direction: column;\n  color: $global-colour-textonlight;\n  font-family: $global-font-uidefaultfont;\n  font-size: 1rem;\n  font-weight: 400;\n  font-style: normal;\n  line-height: 20px;\n  width: 14.437rem;\n}\n@mixin button-button-active {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  gap: $base-size-lg;\n  padding: 0.562rem $base-size-2xl;\n  background: $global-colour-action-background;\n  border-radius: $base-radius-sm;\n}\n@mixin button-button-button-text-active {\n  color: $global-colour-action-textonbg;\n  font-family: $global-font-uidefaultfont;\n  font-size: 1.125rem;\n  font-weight: 500;\n  font-style: normal;\n  line-height: 20px;\n}\n@mixin button-button-icon-active {\n  padding: 0rem;\n}\n@mixin button-button-icon-vector-active {\n  border: 0.125rem solid $component-button-icon-colour-resting;\n}\n@mixin styles-rectangle-1-active {\n  background: $base-colour-grey-400;\n}\n@mixin styles-rectangle-13-active {\n  background: $base-colour-static-black;\n}\n@mixin styles-rectangle-16-active {\n  background: $base-colour-static-black-50;\n}\n@mixin styles-rectangle-17-active {\n  background: $base-colour-static-black-30;\n}\n@mixin styles-rectangle-18-active {\n  background: $base-colour-static-black-10;\n}\n@mixin styles-rectangle-14-active {\n  background: $base-colour-static-white;\n}\n@mixin styles-rectangle-15-active {\n  background: $base-colour-static-transparent;\n  box-shadow: inset 0 0.062rem 0 0 #000000, inset -0.062rem 0 0 0 #000000, inset 0 -0.062rem 0 0 #000000, inset 0.062rem 0 0 0 #000000;\n}\n@mixin styles-rectangle-5-active {\n  background: $base-colour-blue-400;\n}\n@mixin styles-rectangle-9-active {\n  background: $base-colour-pink-400;\n}\n@mixin styles-rectangle-2-active {\n  background: $base-colour-grey-300;\n}\n@mixin styles-rectangle-6-active {\n  background: $base-colour-blue-300;\n}\n@mixin styles-rectangle-10-active {\n  background: $base-colour-pink-300;\n}\n@mixin styles-rectangle-3-active {\n  background: $base-colour-grey-200;\n}\n@mixin styles-rectangle-7-active {\n  background: $base-colour-blue-200;\n}\n@mixin styles-rectangle-11-active {\n  background: $base-colour-pink-200;\n}\n@mixin styles-rectangle-4-active {\n  background: $base-colour-grey-100;\n}\n@mixin styles-rectangle-8-active {\n  background: $base-colour-blue-100;\n}\n@mixin styles-rectangle-12-active {\n  background: $base-colour-pink-100;\n}\n@mixin styles-text-size-24-active {\n  color: #000000;\n  font-family: Inter;\n  font-size: 1.5rem;\n  font-weight: 600;\n  font-style: normal;\n  line-height: normal;\n}\n@mixin styles-inter-active {\n  color: #000000;\n  font-family: Inter;\n  font-size: 1.5rem;\n  font-weight: 600;\n  font-style: normal;\n  line-height: normal;\n}\n@mixin styles-noto-serif-active {\n  color: #000000;\n  font-family: Noto Serif;\n  font-size: 1.5rem;\n  font-weight: 400;\n  font-style: normal;\n  line-height: normal;\n}\n@mixin styles-text-size-20-active {\n  color: #000000;\n  font-family: Inter;\n  font-size: 1.25rem;\n  font-weight: 600;\n  font-style: normal;\n  line-height: normal;\n}\n@mixin styles-text-size-18-active {\n  color: #000000;\n  font-family: Inter;\n  font-size: 1.125rem;\n  font-weight: 600;\n  font-style: normal;\n  line-height: normal;\n}\n@mixin styles-text-size-16-active {\n  color: #000000;\n  font-family: Inter;\n  font-size: 1rem;\n  font-weight: 600;\n  font-style: normal;\n  line-height: normal;\n}\n`,
          warnings: [
            'Warning 1',
            'Warning 2: This is a longer warning to test wrapping in the UI',
            "Warning 3: An even longer warning message that should definitely wrap onto multiple lines in order to fully test the UI's capability to handle such scenarios without breaking the layout or causing any visual glitches.",
          ],
          errors: [],
        });
      }, 1200);
    } else if (message.type === 'create-pr') {
      setTimeout(() => {
        mockPostMessageToUI({
          type: 'pr-created',
          prUrl: 'https://www.google.com/search?q=this+is+a+mock+url',
        });
      }, 500);
    } else if (message.type === 'export-test-data') {
      setTimeout(() => {
        mockPostMessageToUI({
          type: 'test-data-exported',
          data: JSON.stringify(
            { ...message, text: 'This is a mock exported test data file' },
            null,
            2,
          ),
        });
      }, 500);
    }
  };

  window.addEventListener('message', onMessage);
};
