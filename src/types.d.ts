declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const content: string;
  export default content;
}

// X OAuth2 User type
export interface XUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  verified?: boolean;
}
