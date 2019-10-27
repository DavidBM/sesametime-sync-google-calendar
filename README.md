# Sesametime sync tool for Google Calendar

Sesame time has the capacity of syncing via exporting a calendar. That works for 1 company where everyone is using sesame time.

This tool take sesametime and push events to others N calendars, keeping them updated in each run.

This helps in situations where the company is a part of a bigger company or where different teams are working together.

The final objective is to have a Google Calendar with all the holidays set as soon as someone publish them in sesametime.

## How it works

You need to create a file called 'credentials.json' in the folder where you execute this program (provably inside of the code itself, next to the package.json). 

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

## How to get a refresh token?

You will need to get an application ID from the google console. 

Once you have it, copypaste this in your browser:

```
https://accounts.google.com/o/oauth2/v2/auth?
scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar&
access_type=offline&
include_granted_scopes=true&
state=state_parameter_passthrough_value&
redirect_uri=urn:ietf:wg:oauth:2.0:oob&
response_type=code&
client_id=<<YOUR_CLIENT_ID>>
```

Follow the steps and ignore the warning (basically they are telling that the app is not verified. You can choose to verified with Google if you want and the warning will disappear).

At the end of the process it will show you a code. That is a 1 time use auth code. With that code we will generate the refresh token.

Copypaste this in your terminal:

```
curl -X POST \
  https://www.googleapis.com/oauth2/v4/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'code=<<THE_PREVIOUS_AUTH_TOKEN_URL_ENCODED>>&client_id=<<YOUR_GOOGLE_APP_CLIENT_ID>>&client_secret=<<YOUR_GOOGLE_APP_SECRET>>&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&grant_type=authorization_code'
```

Remember to URL encode the variables. That means that no spaces, but %20, etc.

This will return you a JSON like this:

```
{
  "access_token": "long-token...",
  "expires_in": 3600,
  "refresh_token": "THE TOKEN WE WANT :D",
  "scope": "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar",
  "token_type": "Bearer"
}
```

Copy and save in credentials.json the refresh token. 

## About synchronizing several calendars

The code will iterate over all calendars. For now it uses the same refresh_token for all calendar, that means that the account that you use for creating the refresh token needs access to all calendars you want to synchronize.
