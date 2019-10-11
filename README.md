# Sesametime sync tool for Google Calendar

Sesame time has the capacity of syncing via exporting a calendar. That works for 1 company where everyone is using sesame time.

This tool take sesametime and push events to others N calendars, keeping them updated in each run.

This helps in situations where the company is a part of a bigger company or where different teams are working together.

The final objective is to have a Google Calendar with all the holidays set as soon as someone publish them in sesametime.

## How it works

You need to create a file called 'credentials.json' in the folder where you execute this program (provably inside iof the code itselfs, next to the package.json). 

The file must look like: 

```json
{
    "google_calendar_refresh_token": "refresh_token to use to access to google calndar API",
    "google_calendar_app_id": "Google OAuth App id. Can be created in  https://console.cloud.google.com/,
    "google_calendar_client_secret": "Same as google_calendar_app_id, but the OAuth secret",
    "sesame_token": "Can be generated from the sesametime.com web interface",
    "calendars_to_sync": ["id of the calendars to sync", "one per string in the array"]
}

```
