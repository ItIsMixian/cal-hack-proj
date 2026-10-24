# MirrorVille login assets

Exported from the team's [Cal Hack UI deisign](https://www.figma.com/design/Meypech1vVxgjSMMi8zckU/Cal-Hack-UI-deisign?node-id=0-1), 2026-10-24, through Figma design context. Original PNG source assets are retained, including transparent margins. The composed reference screenshot is not used in the application.

| File | Figma node | Original pixels | Render slot |
| --- | --- | --- | --- |
| village.png | 3:20 | 1536 × 1024 | Full viewport landscape; cover on wider/portrait screens |
| signboard.png | 4:29 | 1536 × 1024 | 1276 × 851 on the 1768 × 1179 reference stage |
| logo.png | 2:7 | 2172 × 724 | 1132 × 377 on the reference stage |
| button.png | 4:32 | 2172 × 724 | 525 × 175; transparent margins preserved |
| email.png | 4:38 | 2172 × 724 | 580 × 94 crop per Figma (205.67% image height, -53.37% top) |
| password.png | 4:46 | 2172 × 724 | Same crop; secure hosted-login explanation replaces a local password field |

`src/LoginScreen.tsx` composes these layers with native HTML controls. `src/login.css` preserves reference-stage geometry on desktop and adapts the composition on portrait screens. Typography: locally hosted Pixelify Sans, whose license is in `public/fonts/PixelifySans-OFL.txt`.
