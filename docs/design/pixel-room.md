# Pixel room interface

The owner enters a small personal room instead of scrolling through a profile form. This is the first visual version requested on 2026-10-24. The cream, sage, timber and pixel typography continue the login screen; the existing Cup Nooble character stays. The room and furniture are local, editable SVG/CSS artwork.

The mirror (or character) opens the self-card; the journal opens that mirror's diary; the card box opens facet cards and visibility controls; the desk opens the existing redacted import pipeline and manual note editor; the address book opens private contact editing. These are entry points to existing data, not new simulation mechanics. The room remains a dedicated page, consistent with decision 0005; individual objects open native modal dialogs inside that page.

Room composition uses a proportional reference scene, with larger objects and a taller scene on phones. Buttons support keyboard focus, native dialogs contain focus, Escape closes the top panel, and closing returns focus to the object. The room does not introduce controller support or character movement. Long forms and diaries scroll inside the panel. No backend, privacy or evidence rules change.


The initial static room described above now hands desk/mirror learning to the moving-character
journey in `first-meeting.md`. This newer path adds client-side floor movement and contextual voice
rehearsal, while the original diary, contact and detailed-card tools remain available.
