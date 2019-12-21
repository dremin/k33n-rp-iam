# K33N RP Identity and Access Management
This app is currently used to automate identity and access management for the K33N RP GTA V FiveM servers. It integrates with IPS, Discord, Steam, and Bubble for various capabilities.

## Features:
- Single sign-on using IPS
- RESTful API
- Customizable JSON-defined forms with HTML rich descriptions and access control
- Automatic user notification via direct message, defined with customizable HTML
- Form moderation and approval voting process, including denial messages
- Automation of form approval actions, such as setting IPS groups, Discord role, and server whitelist
- Automation of form validation, such as verifying Discord name, Steam hex, and Bubble entity
- Both applicants and administrators have visibility into validation issues and can mark the issues as resolved to automate the process of fixing user input errors
- Manual whitelist control, including adding new users, priority, warns and bans with reason logging
- Ability to view completed forms
- Secret phrase as a second step of authentication for administrators
- FiveM resource for validating user whitelist status upon server join
- FiveM character information display
- Discord webhook for new form submission notifications

## Technology Stack
- Node.js and Express back-end
- MySQL database
- HTML/CSS/JS web client without any fancy JS frameworks

## Quick Start
1. Import `rp_iam.sql` into MySQL server
2. Create OAuth client in IPS
3. Generate API keys for Discord, Steam, and Bubble
4. Copy `config_example.json` to `~/k33n-rp-iam.json` and set values appropriately
5. Define email templates in the `emails` directory
6. Define forms in the `forms` database table and templates in the `forms` directory
7. Add `K33N_Gatekeeper` resource to FiveM
8. Front-end server with an SSL reverse proxy
9. Add the service as a `systemd` unit for auto-start on boot
10. Maybe more; I haven't tested these instructions!

## To Do
- Server-sided validation of required form fields being present
- Discord notifications for warns and bans
- Ability to define a separate database server for character information display
- Better readme with configuration descriptions