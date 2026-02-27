import type { GitProvider } from '@eggstractor/common';
import type { ProviderLabels } from '../types';

const PROVIDER_LABELS_MAP: Record<GitProvider, ProviderLabels> = {
  github: {
    providerLabel: 'GitHub',
    repoLabel: 'GitHub repository',
    repoHint: 'e.g., levi-myers/eggstractor-demo',
    repoLinkHref:
      'https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories',
    tokenLabel: 'GitHub token',
    tokenLinkHref:
      'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token',
  },
  gitlab: {
    providerLabel: 'GitLab',
    repoLabel: 'GitLab project',
    repoHint: 'e.g., username/project-name',
    repoLinkHref: 'https://docs.gitlab.com/ee/user/project/',
    tokenLabel: 'GitLab token',
    tokenLinkHref: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html',
  },
};

export function getProviderLabels(provider: GitProvider): ProviderLabels {
  return PROVIDER_LABELS_MAP[provider];
}
