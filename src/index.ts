/**
Steps:
	1) Get sesametime all users
	2) For each user, get the holiday events
	3) Get Google calendar events
	4) Match Google calendar events with sesame users.
	5) Delete all the matched events from google Calendar
	6) Recreate the events based in sesametime events
		- Save the user id somewhere in the event in order to make the match in the future.
**/

import * as request from 'request-promise-native';
import {CredentialsService} from './credentials-service';

const credentialsService = new CredentialsService('./credentials.json', request);

credentialsService.getGoogleToken();
